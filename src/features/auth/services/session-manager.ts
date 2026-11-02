import {
  ApiError,
  normalizeApiError,
} from "../../../services/api/api-error.ts";
import type { AuthData, AuthStatus, AuthUser } from "../types/auth-types.ts";

type SessionDependencies = {
  read: () => Promise<string | null>;
  write: (token: string) => Promise<void>;
  remove: () => Promise<void>;
  requestRefresh: (token: string) => Promise<AuthData>;
  requestLogout: (token: string) => Promise<void>;
  onStatus: (status: AuthStatus) => void;
  onUser: (user: AuthUser) => void;
  onClear: () => void;
};

/** Quản lý credential và các race giữa restore, refresh, đăng nhập và đăng xuất. */
export class SessionManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private userId: string | null = null;
  private version = 0;
  private refreshPromise?: Promise<AuthData>;
  private restorePromise?: Promise<void>;
  private storageQueue: Promise<void> = Promise.resolve();
  private restoreError: ApiError | null = null;

  private readonly dependencies: SessionDependencies;
  constructor(dependencies: SessionDependencies) {
    this.dependencies = dependencies;
  }
  getAccessToken = () => this.accessToken;
  getVersion = () => this.version;
  getRestoreError = () => this.restoreError;

  private storage(operation: () => Promise<void>) {
    const pending = this.storageQueue.then(operation);
    this.storageQueue = pending.catch(() => {}); // lỗi vẫn được trả về caller; queue phải tiếp tục hoạt động.
    return pending;
  }

  private async accept(data: AuthData, version: number) {
    if (version !== this.version) throw new ApiError("CANCELLED");
    try {
      await this.storage(() => this.dependencies.write(data.refreshToken));
    } catch {
      throw new ApiError("STORAGE");
    }
    if (version !== this.version) throw new ApiError("CANCELLED");
    // A confirmed Google email link can switch accounts without passing through logout.
    if (this.userId !== null && this.userId !== data.user.id)
      this.dependencies.onClear();
    this.userId = data.user.id;
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.restoreError = null;
    this.dependencies.onUser(data.user);
    this.dependencies.onStatus("authenticated");
    return data;
  }

  async authenticate(request: () => Promise<AuthData>) {
    return this.authenticateOutcome(request, (data) => data);
  }

  /** Google can require email confirmation; only an outcome with credentials grants a session. */
  async authenticateOutcome<T>(
    request: () => Promise<T>,
    credentials: (outcome: T) => AuthData | null,
  ): Promise<T> {
    const version = ++this.version;
    const outcome = await request();
    const data = credentials(outcome);
    if (!data) {
      if (version !== this.version) throw new ApiError("CANCELLED");
      return outcome;
    }
    try {
      await this.accept(data, version);
      return outcome;
    } catch (error) {
      // Credential cấp trên server nhưng không lưu được/stale phải được thu hồi.
      try {
        await this.dependencies.requestLogout(data.refreshToken);
      } catch {
        /* TTL giới hạn phiên mồ côi. */
      }
      throw error;
    }
  }

  restore = (): Promise<void> => {
    if (this.restorePromise) return this.restorePromise;
    this.restorePromise = this.restoreSession().finally(() => {
      this.restorePromise = undefined;
    });
    return this.restorePromise;
  };

  private async restoreSession() {
    const version = this.version;
    this.restoreError = null;
    this.dependencies.onStatus("restoring");
    try {
      const token = await this.dependencies.read().catch(() => {
        throw new ApiError("STORAGE");
      });
      if (version !== this.version) return;
      if (!token) {
        this.dependencies.onStatus("anonymous");
        return;
      }
      if (token.length > 4096 || token.length === 0) {
        await this.expire();
        return;
      }
      this.refreshToken = token;
      await this.refresh();
    } catch (error) {
      if (version !== this.version) return;
      this.restoreError = normalizeApiError(error);
      this.dependencies.onStatus("restore-error");
    }
  }

  refresh = (): Promise<AuthData> => {
    if (this.refreshPromise) return this.refreshPromise;
    const version = this.version;
    const token = this.refreshToken;
    if (!token) return Promise.reject(new ApiError("AUTH_001", 401));
    const pending = this.dependencies
      .requestRefresh(token)
      .then(async (data) => {
        try {
          return await this.accept(data, version);
        } catch (error) {
          // Thu hồi cả token được rotate trong lúc logout hoặc khi SecureStore lỗi.
          try {
            await this.dependencies.requestLogout(data.refreshToken);
          } catch {
            /* TTL giới hạn phiên mồ côi. */
          }
          throw error;
        }
      })
      .catch(async (error: unknown) => {
        const failure = normalizeApiError(error);
        if (
          version === this.version &&
          (failure.status === 401 ||
            failure.code === "AUTH_007" ||
            failure.code === "STORAGE" ||
            failure.code === "INVALID_RESPONSE")
        ) {
          await this.expire();
        }
        throw failure;
      });
    this.refreshPromise = pending.finally(() => {
      if (this.refreshPromise === tracked) this.refreshPromise = undefined;
    });
    const tracked = this.refreshPromise;
    return tracked;
  };

  expire = async () => {
    ++this.version;
    this.accessToken = null;
    this.refreshToken = null;
    this.userId = null;
    this.refreshPromise = undefined;
    this.dependencies.onClear();
    try {
      await this.storage(this.dependencies.remove);
    } catch {
      this.restoreError = new ApiError("STORAGE");
      this.dependencies.onStatus("restore-error");
      throw this.restoreError;
    }
    this.dependencies.onStatus("anonymous");
  };

  logout = async (): Promise<boolean> => {
    const token = this.refreshToken;
    await this.expire();
    if (!token) return true;
    try {
      await this.dependencies.requestLogout(token);
      return true;
    } catch {
      return false;
    } // caller hiển thị thông báo thu hồi phía server chưa thành công.
  };
}

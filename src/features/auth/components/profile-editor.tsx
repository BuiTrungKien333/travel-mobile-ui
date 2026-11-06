import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useUpdateProfile } from "../hooks/use-auth";
import {
  updateProfileSchema,
  type UpdateProfile,
  type AuthUser,
} from "../types/auth-types";

export function ProfileEditor({
  user,
  onDone,
}: {
  user: AuthUser;
  onDone: () => void;
}) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const update = useUpdateProfile();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: user.fullName, avatarUrl: user.avatarUrl ?? "" },
  });
  return (
    <View style={{ gap: theme.spacing.md }}>
      <Controller
        control={control}
        name="fullName"
        render={({ field, fieldState }) => (
          <AppInput
            label={t("auth.register.fullName")}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            error={fieldState.error ? t("auth.profile.invalidName") : undefined}
            maxLength={100}
            editable={!isSubmitting}
          />
        )}
      />
      <Controller
        control={control}
        name="avatarUrl"
        render={({ field, fieldState }) => (
          <AppInput
            label={t("auth.profile.avatarUrl")}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            error={
              fieldState.error ? t("auth.profile.invalidAvatar") : undefined
            }
            autoCapitalize="none"
            maxLength={1000}
            editable={!isSubmitting}
          />
        )}
      />
      {errors.root ? (
        <AppText accessibilityRole="alert" tone="error">
          {errors.root.message}
        </AppText>
      ) : null}
      <AppButton
        loading={isSubmitting}
        onPress={() =>
          void handleSubmit(async (values) => {
            try {
              await update.mutateAsync(values);
              onDone();
            } catch {
              setError("root", { message: t("auth.profile.saveError") });
            }
          })()
        }
      >
        {t("auth.profile.save")}
      </AppButton>
      <AppButton variant="outline" disabled={isSubmitting} onPress={onDone}>
        {t("auth.profile.cancel")}
      </AppButton>
    </View>
  );
}

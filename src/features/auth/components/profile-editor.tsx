import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { useRef, useState } from "react";
import { launchImageLibraryAsync } from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { ContentImage } from "@/components/ui/content-image";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useUnsavedExit } from "@/hooks/use-unsaved-exit";
import { useUpdateProfile } from "../hooks/use-auth";
import { updateProfileSchema, type UpdateProfile, type AuthUser } from "../types/auth-types";

export function ProfileEditor({ user, onDone }: { user: AuthUser; onDone: () => void }) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const update = useUpdateProfile();
  const [avatarPhoto, setAvatarPhoto] = useState<string>();
  const [picking, setPicking] = useState(false);
  const pickerLock = useRef(false);
  const { control, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting, isDirty } } = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema), defaultValues: { fullName: user.fullName, avatarUrl: user.avatarUrl ?? "" },
  });
  const busy = isSubmitting || picking;
  const requestExit = useUnsavedExit(isDirty || !!avatarPhoto, busy);
  async function pickAvatar() {
    if (pickerLock.current || isSubmitting) return;
    pickerLock.current = true;
    setPicking(true);
    try {
      // Open directly from the press event so browsers allow the file picker.
      const result = await launchImageLibraryAsync({
        mediaTypes: ["images"], allowsMultipleSelection: false,
        allowsEditing: true, aspect: [1, 1], quality: 1, exif: false,
      });
      if (result.canceled || !result.assets[0]) return;
      const photo = result.assets[0];
      const context = ImageManipulator.manipulate(photo.uri);
      try {
        const size = Math.min(photo.width, photo.height);
        context.crop({ originX: (photo.width - size) / 2, originY: (photo.height - size) / 2, width: size, height: size });
        context.resize({ width: 512, height: 512 });
        const rendered = await context.renderAsync();
        try {
          const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
          setAvatarPhoto(image.uri);
          clearErrors("root");
        } finally { rendered.release(); }
      } finally { context.release(); }
    } catch {
      setError("root", { message: t("auth.profile.pickError") });
    } finally {
      pickerLock.current = false;
      setPicking(false);
    }
  }
  return <View style={{ gap: theme.spacing.md }}>
    <Controller control={control} name="fullName" render={({ field, fieldState }) => (
      <AppInput label={t("auth.register.fullName")} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} ref={field.ref}
        error={fieldState.error ? t("auth.profile.invalidName") : undefined} maxLength={100} editable={!busy} />
    )} />
    <View style={{ alignItems: "center", gap: theme.spacing.sm }}>
      <View style={{ width: 96, height: 96, borderRadius: theme.radius.full, overflow: "hidden" }}>
        <ContentImage source={avatarPhoto ?? user.avatarUrl} label={t("auth.profile.avatar")} emptyLabel={user.fullName} />
      </View>
      <AppButton variant="outline" disabled={busy} loading={picking} onPress={() => void pickAvatar()}>{t("auth.profile.chooseAvatar")}</AppButton>
      <AppText variant="caption" tone="muted">{t("auth.profile.avatarHint")}</AppText>
    </View>
    {errors.root ? <AppText accessibilityRole="alert" tone="error">{errors.root.message}</AppText> : null}
    <AppButton disabled={busy} loading={isSubmitting} onPress={() => void handleSubmit(async (values) => {
      try { await update.mutateAsync({ ...values, avatarPhoto }); onDone(); }
      catch { setError("root", { message: t("auth.profile.saveError") }); }
    })()}>{t("auth.profile.save")}</AppButton>
    <AppButton variant="outline" disabled={busy} onPress={() => requestExit(onDone)}>{t("auth.profile.cancel")}</AppButton>
  </View>;
}

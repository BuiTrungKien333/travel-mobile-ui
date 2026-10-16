import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { captureSamples, type CapturePhotoId } from "../data/ongoing-preview";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import {
  useTripPreview,
  type JourneyPanel,
} from "../providers/trip-preview-provider";
import type { Trip } from "../types/home-types";
import { homeStyles } from "./home-primitives";

export function CaptureMomentPreview({
  panel,
  trip,
}: {
  panel: Extract<JourneyPanel, { kind: "camera" }>;
  trip: Trip;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useOngoingCopy();
  const { closePanel, openPanel, savePhotoMoment } = useTripPreview(
    (state) => ({
      closePanel: state.closePanel,
      openPanel: state.openPanel,
      savePhotoMoment: state.savePhotoMoment,
    }),
  );
  const [photoId, setPhotoId] = useState<CapturePhotoId>(
    captureSamples.find((sample) => sample.id === panel.stopId)?.id ?? "lake",
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const captured = useRef(false);
  const reduceMotion = useReducedMotion();
  const flash = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const sample =
    captureSamples.find((item) => item.id === photoId) ?? captureSamples[0];
  const place = trip.days
    .find((day) => day.date === panel.date)
    ?.stops.find((stop) => stop.id === photoId);
  useEffect(() => () => cancelAnimation(flash), [flash]);

  function handleCapture() {
    if (captured.current || imageFailed) return;
    captured.current = true;
    const memory = savePhotoMoment({
      tripId: trip.id,
      date: panel.date,
      photoId,
    });
    if (!memory) {
      captured.current = false;
      setError(copy.capacity);
      return;
    }
    setSaved(true);
    setError("");
    if (!reduceMotion) {
      flash.value = 0.4;
      flash.value = withTiming(0, {
        duration: theme.motion.cameraFlashDuration,
        reduceMotion: ReduceMotion.System,
      });
    }
  }
  function handleAnother() {
    captured.current = false;
    setSaved(false);
    setError("");
  }

  return (
    <Modal
      visible
      transparent={false}
      statusBarTranslucent
      animationType={reduceMotion ? "none" : "slide"}
      onRequestClose={closePanel}
    >
      <StatusBar style="light" />
      <SafeAreaView
        style={[styles.screen, { backgroundColor: theme.colors.heroSurface }]}
      >
        <View
          style={[
            homeStyles.row,
            { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.close}
            onPress={closePanel}
            style={({ pressed }) => [
              styles.center,
              {
                width: theme.layout.touchTarget,
                height: theme.layout.touchTarget,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              },
            ]}
          >
            <AppIcon name="close" color={theme.colors.onHero} />
          </Pressable>
          <AppText
            variant="label"
            style={[homeStyles.grow, { color: theme.colors.onHero }]}
          >
            {trip.destination}
          </AppText>
          <AppText
            variant="caption"
            style={{ color: theme.colors.onHeroMuted }}
          >
            {copy.cameraPreview}
          </AppText>
        </View>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={{
            flexGrow: 1,
            width: "100%",
            maxWidth: theme.layout.contentMaxWidth,
            alignSelf: "center",
          }}
        >
          <View
            style={[
              styles.stage,
              {
                minHeight: theme.layout.heroImageHeight,
                margin: theme.spacing.lg,
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.heroSurface,
              },
            ]}
          >
            <Image
              accessible={false}
              source={sample.photo}
              contentFit="cover"
              cachePolicy="memory-disk"
              onError={() => setImageFailed(true)}
              style={StyleSheet.absoluteFill}
            />
            {imageFailed ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  styles.center,
                  {
                    backgroundColor: theme.colors.heroSurface,
                    gap: theme.spacing.md,
                  },
                ]}
              >
                <AppIcon
                  name="camera"
                  color={theme.colors.onHero}
                  size={theme.layout.iconLarge}
                />
                <AppText style={{ color: theme.colors.onHero }}>
                  {copy.photoUnavailable}
                </AppText>
              </View>
            ) : null}
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: theme.colors.surface },
                flashStyle,
              ]}
            />
            <View
              style={[
                styles.stamp,
                {
                  bottom: theme.spacing.md,
                  left: theme.spacing.md,
                  right: theme.spacing.md,
                  padding: theme.spacing.sm,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.heroSurface,
                },
              ]}
            >
              <AppText variant="caption" style={{ color: theme.colors.onHero }}>
                {place?.name[locale] ?? trip.destination}
              </AppText>
              {saved ? (
                <AppText
                  accessibilityLiveRegion="polite"
                  variant="caption"
                  style={{ color: theme.colors.onHeroMuted }}
                >
                  {copy.photoSaved}
                </AppText>
              ) : null}
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: theme.spacing.lg,
              gap: theme.spacing.md,
            }}
          >
            {saved ? (
              <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
                <AppButton
                  variant="outline"
                  style={homeStyles.grow}
                  onPress={handleAnother}
                >
                  {copy.takeAnother}
                </AppButton>
                <AppButton
                  variant="gradient"
                  style={[
                    homeStyles.grow,
                    { borderColor: theme.colors.onHero },
                  ]}
                  onPress={() =>
                    openPanel({
                      kind: "journal",
                      tripId: trip.id,
                      date: panel.date,
                    })
                  }
                >
                  {copy.viewJournal}
                </AppButton>
              </View>
            ) : (
              <>
                <View
                  accessibilityLabel={copy.choosePhoto}
                  style={[
                    homeStyles.row,
                    { justifyContent: "center", gap: theme.spacing.sm },
                  ]}
                >
                  {captureSamples.map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: photoId === item.id }}
                      accessibilityLabel={`${copy.choosePhoto}: ${trip.days.flatMap((day) => day.stops).find((stop) => stop.id === item.id)?.name[locale] ?? item.id}`}
                      onPress={() => {
                        setPhotoId(item.id);
                        setImageFailed(false);
                        setError("");
                      }}
                      style={({ pressed }) => ({
                        width: theme.layout.touchTarget,
                        height: theme.layout.touchTarget,
                        overflow: "hidden",
                        borderRadius: theme.radius.sm,
                        borderWidth: theme.spacing.xxs,
                        borderColor:
                          photoId === item.id
                            ? theme.colors.primary
                            : theme.colors.onHero,
                        opacity: pressed ? theme.motion.pressOpacity : 1,
                      })}
                    >
                      <Image
                        accessible={false}
                        source={item.photo}
                        contentFit="cover"
                        style={StyleSheet.absoluteFill}
                      />
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.shutter}
                  accessibilityState={{ disabled: imageFailed }}
                  disabled={imageFailed}
                  onPress={handleCapture}
                  style={({ pressed }) => [
                    styles.center,
                    {
                      alignSelf: "center",
                      width: theme.layout.cameraShutterSize,
                      height: theme.layout.cameraShutterSize,
                      borderRadius: theme.radius.full,
                      borderWidth: theme.spacing.xs,
                      borderColor: theme.colors.onHero,
                      opacity: imageFailed
                        ? 0.5
                        : pressed
                          ? theme.motion.pressOpacity
                          : 1,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: theme.layout.touchTarget,
                      height: theme.layout.touchTarget,
                      borderRadius: theme.radius.full,
                      backgroundColor: theme.colors.onHero,
                    }}
                  />
                </Pressable>
              </>
            )}
            {error ? (
              <AppText
                accessibilityRole="alert"
                variant="caption"
                style={{ color: theme.colors.onHero }}
              >
                {error}
              </AppText>
            ) : null}
            <AppText
              variant="caption"
              style={[styles.centerText, { color: theme.colors.onHeroMuted }]}
            >
              {copy.savedInSession}
            </AppText>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${copy.photoCredit}: ${sample.credit.author}, ${sample.credit.license}`}
              onPress={() =>
                Linking.openURL(sample.credit.source).catch(() =>
                  setError(copy.linkError),
                )
              }
              style={[styles.center, { minHeight: theme.layout.touchTarget }]}
            >
              <AppText
                variant="caption"
                style={{ color: theme.colors.onHeroMuted }}
              >
                {copy.photoCredit} · {sample.credit.author} ·{" "}
                {sample.credit.license}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  stage: { flex: 1, minHeight: 0, overflow: "hidden" },
  stamp: { position: "absolute" },
  center: { alignItems: "center", justifyContent: "center" },
  centerText: { textAlign: "center" },
});

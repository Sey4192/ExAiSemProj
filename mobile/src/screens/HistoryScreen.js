import React, { useMemo, useState } from "react";
import { Alert, Pressable, SectionList, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { colors, radius, spacing, type, fonts } from "../theme/theme";
import { useApp } from "../context/AppContext";
import GradientHeader from "../components/GradientHeader";
import HistoryItem from "../components/HistoryItem";
import { EmptyState } from "../components/Surface";
import { dayLabel } from "../utils/format";
import { TAB_BAR_SPACE } from "../components/TabBar";
import { tap } from "../utils/haptics";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "low_risk", label: "Balanced" },
  { key: "high_risk", label: "Heavy" },
];

export default function HistoryScreen({ navigation }) {
  const { history, clearHistory } = useApp();
  const [filter, setFilter] = useState("all");

  const sections = useMemo(() => {
    const items = filter === "all" ? history : history.filter((h) => h.result.risk_label === filter);
    const groups = [];
    for (const entry of items) {
      const title = dayLabel(entry.timestamp);
      const last = groups[groups.length - 1];
      if (last && last.title === title) last.data.push(entry);
      else groups.push({ title, data: [entry] });
    }
    return groups;
  }, [history, filter]);

  const confirmClear = () =>
    Alert.alert("Start fresh?", "This clears all your check-ins from this phone. It can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearHistory },
    ]);

  const openEntry = (entry) =>
    navigation.navigate(entry.result.risk_label === "high_risk" ? "Alert" : "LowRiskResult", { entry });

  const header = (
    <>
      <GradientHeader
        eyebrow="Looking back"
        title="Your check-ins"
        subtitle={history.length ? `${history.length} moment${history.length === 1 ? "" : "s"} you paused to check in` : "Kept privately on this phone"}
        rightIcon={history.length ? "trash-can-outline" : null}
        rightLabel="Clear history"
        onRightPress={confirmClear}
        compact
      />
      {history.length > 0 && (
        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable key={f.key} onPress={() => {
                  tap();
                  setFilter(f.key);
                }} style={[styles.filter, active && styles.filterActive]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </>
  );

  return (
    <SectionList
      style={styles.screen}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={header}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => <Text style={styles.day}>{section.title}</Text>}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <HistoryItem entry={item} onPress={() => openEntry(item)} />
        </View>
      )}
      ListEmptyComponent={
        history.length === 0 ? (
          <EmptyState
            icon="history"
            title="Nothing here yet"
            message="Each time you check in, it'll be saved here so you can look back and notice what helps."
          >
            <Button mode="contained" icon="radar" onPress={() => navigation.navigate("Home")} style={styles.emptyButton}>
              Check in now
            </Button>
          </EmptyState>
        ) : (
          <EmptyState icon="filter-off-outline" title="None of these yet" message="When you have some, they'll show up here." />
        )
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: TAB_BAR_SPACE },
  filters: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...type.small, color: colors.text, fontFamily: fonts.semibold },
  filterTextActive: { color: "#fff" },
  day: { ...type.overline, color: colors.textMuted, paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  item: { paddingHorizontal: spacing.lg },
  emptyButton: { borderRadius: radius.md, marginTop: spacing.xs },
});

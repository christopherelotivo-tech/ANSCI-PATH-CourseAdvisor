import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabScreenHeader } from '@/components/tabs/tab-screen-header';
import { BrandTheme, MaxContentWidth } from '@/constants/theme';
import { ANSCI_CURRICULUM } from '@/domain/curriculum/ansci-curriculum';
import { usePlanner } from '@/state/planner-context';

interface PathwayNodeSpec {
  code: string;
  shortLabel: string;
  fullSummary: string;
  isGoalNode?: boolean;
  connectorBelow?: 'vertical' | 'diag-right' | 'diag-left' | 'none';
}

type GraphViewMode = 'GOAL_PATH' | 'ANS040_TREE' | 'COURSE_TIERS';

const ANIMAL_SCIENCE_SPINE_NODES: readonly PathwayNodeSpec[] = [
  {
    code: 'ANS001',
    shortLabel: 'Animal Science',
    fullSummary: 'Introduction to Animal Science · Completed major foundation.',
    connectorBelow: 'vertical',
  },
  {
    code: 'ANS002',
    shortLabel: 'Livestock & Poultry',
    fullSummary:
      'Introduction to Livestock and Poultry Production · Requires ANS001 and unlocks ANS003 & AGR007.',
    connectorBelow: 'diag-right',
  },
  {
    code: 'ANS040',
    shortLabel: 'Anatomy & Physiology',
    fullSummary:
      'Anatomy and Physiology of Farm Animals · Requires AGR001 & CRS001 and unlocks ANS197, ANS150 & ANS151.',
    connectorBelow: 'diag-left',
  },
  {
    code: 'ANS197',
    shortLabel: 'Summer OJT',
    fullSummary:
      'On-the-Job Training (Off-Campus, 240 hrs) · Requires ANS003, ANS040, ANS041, ANS042, ANS043 & ANS044.',
    connectorBelow: 'vertical',
  },
  {
    code: 'ANS199',
    shortLabel: 'Your goal · Thesis',
    fullSummary:
      'Undergraduate Thesis: Manuscript Writing and Oral Defense · Requires ANS195 (which requires ANS194 & CAS).',
    isGoalNode: true,
    connectorBelow: 'none',
  },
];

const EXTRA_GRAPH_NODES: Record<string, PathwayNodeSpec> = {
  AGR001: {
    code: 'AGR001',
    shortLabel: 'Intro to Agriculture',
    fullSummary:
      'Introduction to Agriculture (1st Year · 1st Sem) · Direct prerequisite for ANS040 (Anatomy & Physiology of Farm Animals).',
  },
  CRS001: {
    code: 'CRS001',
    shortLabel: 'Crop Production',
    fullSummary:
      'Principles of Crop Production (1st Year · 1st Sem) · Direct prerequisite for ANS040 & CRS002.',
  },
};

/**
 * Screen 14 — Goal Path / Prerequisite Graph (`14_Goal_Path_Prerequisite_Graph.png`)
 *
 * Implements Stages 7, 8 & 9 of `docs/Flow.pdf`:
 * - Interactive Goal Pathway spine (`ANS001 -> ANS002 -> ANS040 -> ANS197 -> ANS199`)
 *   with `AGR001` & `CRS001` prerequisite feeders into `ANS040`
 * - Dedicated `ANS040` Prerequisite Tree view (`Flow.pdf` Page 3 Example)
 * - Topological Course Ordering Tiers (`Tier 0..N`) view (`Flow.pdf` Step 9)
 * - Selected course detail card with clickable missing prerequisite navigation
 */
export default function GoalPathGraphScreen() {
  const { profile, completedCourses, backwardChaining, topologicalSort } =
    usePlanner();
  const [selectedCode, setSelectedCode] = useState<string>('ANS001');
  const [zoomPercent, setZoomPercent] = useState<100 | 110>(100);
  const [viewMode, setViewMode] = useState<GraphViewMode>('GOAL_PATH');

  const spineOrExtraSpec =
    ANIMAL_SCIENCE_SPINE_NODES.find((n) => n.code === selectedCode) ??
    EXTRA_GRAPH_NODES[selectedCode];
  const catalogCourse = ANSCI_CURRICULUM.courses.find(
    (c) => c.code === selectedCode
  );
  const selectedAnalysis = backwardChaining.analysisByCourse[selectedCode];

  const selectedSpec: PathwayNodeSpec = spineOrExtraSpec ?? {
    code: selectedCode,
    shortLabel: catalogCourse?.title ?? selectedCode,
    fullSummary: catalogCourse
      ? `${catalogCourse.title} (${catalogCourse.units} units)${
          catalogCourse.prerequisites.length > 0
            ? ` · Requires ${catalogCourse.prerequisites.join(', ')}`
            : ' · No pending prerequisites'
        }.`
      : `${selectedCode} curriculum course.`,
  };

  const handleToggleZoom = () => {
    setZoomPercent((prev) => (prev === 100 ? 110 : 100));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.mainColumn}>
        <TabScreenHeader
          eyebrow="COURSE MAP"
          title="Goal path"
          fullName={profile.fullName}
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Pathway Section Intro */}
          <View style={styles.pathwayIntroBlock}>
            <Text style={styles.pathwayEyebrow}>
              YOUR PATH TO ANIMAL SCIENTIST
            </Text>
            <Text style={styles.pathwayTitle}>Animal Science pathway</Text>
            <Text style={styles.pathwaySubtitle}>
              Only the courses that move you toward your goal
            </Text>

            {/* Legend Row */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={styles.legendDotComplete} />
                <Text style={styles.legendText}>Complete</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendRingNextUp} />
                <Text style={styles.legendText}>Next up</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendRingLater} />
                <Text style={styles.legendText}>Later</Text>
              </View>
            </View>

            {/* Graph View Switcher: Goal Path | ANS040 Dependency | Course Tiers */}
            <View style={styles.modeSwitcherRow} testID="graph-mode-switcher">
              <Pressable
                accessibilityRole="button"
                testID="graph-mode-goal-path"
                onPress={() => setViewMode('GOAL_PATH')}
                style={[
                  styles.modePill,
                  viewMode === 'GOAL_PATH' && styles.modePillActive,
                ]}>
                <Text
                  style={[
                    styles.modePillText,
                    viewMode === 'GOAL_PATH' && styles.modePillTextActive,
                  ]}>
                  Goal Path
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                testID="graph-mode-ans040-tree"
                onPress={() => {
                  setViewMode('ANS040_TREE');
                  setSelectedCode('ANS040');
                }}
                style={[
                  styles.modePill,
                  viewMode === 'ANS040_TREE' && styles.modePillActive,
                ]}>
                <Text
                  style={[
                    styles.modePillText,
                    viewMode === 'ANS040_TREE' && styles.modePillTextActive,
                  ]}>
                  ANS040 Prereqs
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                testID="graph-mode-course-tiers"
                onPress={() => setViewMode('COURSE_TIERS')}
                style={[
                  styles.modePill,
                  viewMode === 'COURSE_TIERS' && styles.modePillActive,
                ]}>
                <Text
                  style={[
                    styles.modePillText,
                    viewMode === 'COURSE_TIERS' && styles.modePillTextActive,
                  ]}>
                  Course Ordering
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Dotted Graph Canvas */}
          <View style={styles.graphCanvas} testID="prerequisite-graph-canvas">
            {viewMode === 'GOAL_PATH' && (
              <View
                style={[
                  styles.nodesColumn,
                  zoomPercent === 110 && styles.nodesColumnZoomed,
                ]}>
                {ANIMAL_SCIENCE_SPINE_NODES.map((nodeSpec) => {
                  const isCompleted = completedCourses.has(nodeSpec.code);
                  const analysis =
                    backwardChaining.analysisByCourse[nodeSpec.code];
                  const isNextUp =
                    !isCompleted &&
                    (analysis?.status === 'ELIGIBLE_NOW' ||
                      nodeSpec.code === 'ANS001');
                  const isSelected = selectedCode === nodeSpec.code;

                  return (
                    <View key={nodeSpec.code} style={styles.nodeStepWrapper}>
                      {/* For ANS040, show feeder prerequisite badges AGR001 & CRS001 */}
                      {nodeSpec.code === 'ANS040' && (
                        <View style={styles.feederPrereqsRow}>
                          {(['AGR001', 'CRS001'] as const).map((prereqCode) => {
                            const prereqDone = completedCourses.has(prereqCode);
                            const prereqSelected = selectedCode === prereqCode;
                            return (
                              <Pressable
                                key={prereqCode}
                                accessibilityRole="button"
                                testID={`graph-node-${prereqCode}`}
                                onPress={() => setSelectedCode(prereqCode)}
                                style={[
                                  styles.feederPrereqPill,
                                  prereqDone && styles.feederPrereqPillDone,
                                  prereqSelected &&
                                    styles.feederPrereqPillSelected,
                                ]}>
                                <Text style={styles.feederPrereqText}>
                                  {`${prereqDone ? '✓ ' : ''}${prereqCode} →`}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}

                      <Pressable
                        accessibilityRole="button"
                        testID={`graph-node-${nodeSpec.code}`}
                        onPress={() => setSelectedCode(nodeSpec.code)}
                        style={[
                          styles.graphNodeCard,
                          isNextUp && styles.graphNodeNextUp,
                          isCompleted && styles.graphNodeCompleted,
                          nodeSpec.isGoalNode && styles.graphNodeGoal,
                          isSelected &&
                            !nodeSpec.isGoalNode &&
                            styles.graphNodeSelectedShadow,
                        ]}>
                        <Text
                          style={[
                            styles.graphNodeCodeText,
                            isNextUp && styles.graphNodeCodeNextUp,
                            nodeSpec.isGoalNode && styles.graphNodeCodeGoal,
                          ]}>
                          {nodeSpec.isGoalNode
                            ? `✓  ${nodeSpec.code}`
                            : nodeSpec.code}
                        </Text>
                        <Text
                          style={[
                            styles.graphNodeSubtitleText,
                            nodeSpec.isGoalNode && styles.graphNodeSubtitleGoal,
                          ]}>
                          {nodeSpec.shortLabel}
                        </Text>
                      </Pressable>

                      {nodeSpec.connectorBelow === 'vertical' && (
                        <View style={styles.connectorVertical} />
                      )}
                      {nodeSpec.connectorBelow === 'diag-right' && (
                        <View style={styles.connectorDiagRightWrap}>
                          <View style={styles.connectorDiagRightLine} />
                        </View>
                      )}
                      {nodeSpec.connectorBelow === 'diag-left' && (
                        <View style={styles.connectorDiagLeftWrap}>
                          <View style={styles.connectorDiagLeftLine} />
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {viewMode === 'ANS040_TREE' && (
              <View
                style={styles.ans040TreeWrap}
                testID="graph-ans040-dependency-view">
                <Text style={styles.ans040TreeHeading}>
                  Example: ANS040 — Anatomy & Physiology of Farm Animals
                </Text>

                {/* Target Node ANS040 */}
                <Pressable
                  accessibilityRole="button"
                  testID="graph-node-ANS040"
                  onPress={() => setSelectedCode('ANS040')}
                  style={[
                    styles.graphNodeCard,
                    completedCourses.has('ANS040')
                      ? styles.graphNodeCompleted
                      : backwardChaining.analysisByCourse['ANS040']?.status ===
                          'ELIGIBLE_NOW'
                        ? styles.graphNodeNextUp
                        : null,
                  ]}>
                  <Text style={styles.graphNodeCodeText}>ANS040</Text>
                  <Text style={styles.graphNodeSubtitleText}>
                    Anatomy & Physiology of Farm Animals
                  </Text>
                </Pressable>

                <Text style={styles.treeConnectorText}>
                  ↑ requires both prerequisites
                </Text>

                <View style={styles.ans040PrereqPairRow}>
                  {(['AGR001', 'CRS001'] as const).map((code) => {
                    const spec = EXTRA_GRAPH_NODES[code];
                    const isDone = completedCourses.has(code);
                    return (
                      <Pressable
                        key={code}
                        accessibilityRole="button"
                        testID={`ans040-prereq-node-${code}`}
                        onPress={() => setSelectedCode(code)}
                        style={[
                          styles.ans040PrereqCard,
                          isDone
                            ? styles.graphNodeCompleted
                            : styles.graphNodeNextUp,
                        ]}>
                        <Text style={styles.graphNodeCodeText}>{code}</Text>
                        <Text style={styles.graphNodeSubtitleText}>
                          {spec.shortLabel}
                        </Text>
                        <Text style={styles.ans040PrereqStatusText}>
                          {isDone ? '✓ Completed' : 'Available Now'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.dagSafetyBanner}>
                  <Text style={styles.dagSafetyText}>
                    {backwardChaining.isValidDag
                      ? '✓ Circular Prerequisite Protection Active: 0 cycles detected in curriculum DAG.'
                      : 'Circular dependency warning'}
                  </Text>
                </View>
              </View>
            )}

            {viewMode === 'COURSE_TIERS' && (
              <View
                style={styles.tiersViewWrap}
                testID="graph-course-ordering-view">
                <Text style={styles.ans040TreeHeading}>
                  Course Ordering — Kahn’s Topological Tiers
                </Text>
                {topologicalSort.tiers.map((tierGroup) => (
                  <View key={tierGroup.tier} style={styles.graphTierCard}>
                    <View style={styles.graphTierHeader}>
                      <Text style={styles.graphTierTitle}>
                        {`Tier ${tierGroup.tier}`}
                      </Text>
                      <Text style={styles.graphTierSub}>
                        {tierGroup.tier === 0
                          ? 'Ready now (0 unsatisfied prerequisites)'
                          : `Scheduled after Tier ${tierGroup.tier - 1}`}
                      </Text>
                    </View>
                    <View style={styles.graphTierChipsRow}>
                      {tierGroup.courses.map((course) => (
                        <Pressable
                          key={course.code}
                          accessibilityRole="button"
                          testID={`tier-course-chip-${course.code}`}
                          onPress={() => setSelectedCode(course.code)}
                          style={[
                            styles.graphTierChip,
                            selectedCode === course.code &&
                              styles.graphTierChipActive,
                          ]}>
                          <Text
                            style={[
                              styles.graphTierChipText,
                              selectedCode === course.code &&
                                styles.graphTierChipTextActive,
                            ]}>
                            {course.code}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Bottom-right Zoom Pill */}
            <Pressable
              accessibilityRole="button"
              testID="graph-zoom-button"
              onPress={handleToggleZoom}
              style={styles.zoomBadge}>
              <Text style={styles.zoomPlusSymbol} allowFontScaling={false}>
                +
              </Text>
              <Text style={styles.zoomPercentLabel} allowFontScaling={false}>
                {`${zoomPercent}%`}
              </Text>
            </Pressable>
          </View>

          {/* Selected Course Inspector Card */}
          <View
            style={styles.selectedCourseCard}
            testID="graph-selected-course-card">
            <View style={styles.selectedCourseIconBox} aria-hidden>
              <View style={styles.selectedDocIcon}>
                <View style={styles.selectedDocLine} />
                <View style={styles.selectedDocLine} />
              </View>
            </View>
            <View style={styles.selectedCourseTextCol}>
              <Text
                style={styles.selectedCourseCode}
                testID="graph-selected-course-code">
                {selectedSpec.code}
              </Text>
              <Text
                style={styles.selectedCourseSummary}
                testID="graph-selected-course-summary">
                {selectedSpec.fullSummary}
              </Text>
              {selectedAnalysis && (
                <Text style={styles.selectedCoursePrereqMeta}>
                  {selectedAnalysis.missingPrerequisites.length > 0
                    ? `Pending prerequisites: ${selectedAnalysis.missingPrerequisites.join(
                        ', '
                      )}`
                    : selectedAnalysis.missingCasStanding
                      ? 'Pending requirement: CAS (2nd Year completion)'
                      : 'All direct prerequisites satisfied ✓'}
                </Text>
              )}

              {/* Clickable Missing Prerequisite Pills (Flow.pdf Step 7) */}
              {selectedAnalysis &&
                selectedAnalysis.missingPrerequisites.length > 0 && (
                  <View style={styles.missingPrereqJumpRow}>
                    {selectedAnalysis.missingPrerequisites.map((reqCode) => (
                      <Pressable
                        key={reqCode}
                        accessibilityRole="button"
                        testID={`jump-to-prereq-${reqCode}`}
                        onPress={() => setSelectedCode(reqCode)}
                        style={styles.missingPrereqJumpPill}>
                        <Text style={styles.missingPrereqJumpText}>
                          {`View ${reqCode} info →`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
            </View>
          </View>

          {/* How to Read This Map Helper Card */}
          <View style={styles.howToReadCard}>
            <View style={styles.bulbIconWrap} aria-hidden>
              <View style={styles.bulbCircle} />
              <View style={styles.bulbBase} />
            </View>
            <View style={styles.howToReadTextCol}>
              <Text style={styles.howToReadTitle}>How to read this map</Text>
              <Text style={styles.howToReadSubtitle}>
                Follow the lines upward. Each course prepares you for the one
                after it. Circular dependencies are automatically blocked.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FCF9',
    alignItems: 'center',
  },
  mainColumn: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    backgroundColor: '#F9FCF9',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 28,
    gap: 14,
  },
  pathwayIntroBlock: {
    gap: 4,
  },
  pathwayEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: BrandTheme.primaryGreen,
  },
  pathwayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
    letterSpacing: -0.3,
  },
  pathwaySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: BrandTheme.textSecondary,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotComplete: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandTheme.primaryGreen,
  },
  legendRingNextUp: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.8,
    borderColor: '#D9822B',
  },
  legendRingLater: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.8,
    borderColor: '#9AA6A0',
  },
  legendText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: BrandTheme.textSecondary,
  },
  graphCanvas: {
    backgroundColor: '#FCFDFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE8E0',
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    position: 'relative',
  },
  nodesColumn: {
    alignItems: 'center',
    width: '100%',
  },
  nodesColumnZoomed: {
    transform: [{ scale: 1.04 }],
  },
  nodeStepWrapper: {
    alignItems: 'center',
  },
  graphNodeCard: {
    width: 158,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DCE4DF',
    alignItems: 'center',
    gap: 3,
  },
  graphNodeNextUp: {
    borderColor: '#DE8C3A',
    backgroundColor: '#FFFDF9',
  },
  graphNodeCompleted: {
    borderColor: BrandTheme.primaryGreen,
    backgroundColor: '#F1FAF4',
  },
  graphNodeGoal: {
    backgroundColor: '#1E7D4E',
    borderColor: '#1E7D4E',
  },
  graphNodeSelectedShadow: {
    shadowColor: '#196B45',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  graphNodeCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
  },
  graphNodeCodeNextUp: {
    color: '#A15812',
  },
  graphNodeCodeGoal: {
    color: '#FFFFFF',
  },
  graphNodeSubtitleText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: BrandTheme.textSecondary,
  },
  graphNodeSubtitleGoal: {
    color: '#D5F2E2',
  },
  connectorVertical: {
    width: 2,
    height: 32,
    backgroundColor: '#90B8A1',
  },
  connectorDiagRightWrap: {
    height: 40,
    width: 120,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  connectorDiagRightLine: {
    width: 2,
    height: 46,
    backgroundColor: '#90B8A1',
    marginRight: 20,
    transform: [{ rotate: '-36deg' }],
  },
  connectorDiagLeftWrap: {
    height: 40,
    width: 120,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  connectorDiagLeftLine: {
    width: 2,
    height: 46,
    backgroundColor: '#90B8A1',
    marginLeft: 20,
    transform: [{ rotate: '36deg' }],
  },
  zoomBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 48,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5DF',
    alignItems: 'center',
    gap: 2,
  },
  zoomPlusSymbol: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandTheme.textSecondary,
  },
  zoomPercentLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: BrandTheme.textSecondary,
  },
  selectedCourseCard: {
    backgroundColor: '#EDF6F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#D6E8DC',
  },
  selectedCourseIconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  selectedDocIcon: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.6,
    borderColor: BrandTheme.primaryGreen,
    padding: 2.5,
    justifyContent: 'space-around',
  },
  selectedDocLine: {
    width: 7,
    height: 1.5,
    backgroundColor: BrandTheme.primaryGreen,
  },
  selectedCourseTextCol: {
    flex: 1,
    gap: 3,
  },
  selectedCourseCode: {
    fontSize: 12.5,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
  },
  selectedCourseSummary: {
    fontSize: 11.5,
    lineHeight: 16,
    color: BrandTheme.textSecondary,
    fontWeight: '500',
  },
  selectedCoursePrereqMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandTheme.primaryGreen,
    marginTop: 2,
  },
  howToReadCard: {
    backgroundColor: '#EFF4F1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulbIconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  bulbCircle: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 1.6,
    borderColor: '#67786F',
  },
  bulbBase: {
    width: 5,
    height: 3,
    backgroundColor: '#67786F',
    marginTop: 1,
    borderRadius: 1,
  },
  howToReadTextCol: {
    flex: 1,
    gap: 3,
  },
  howToReadTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
  },
  howToReadSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    color: BrandTheme.textSecondary,
    fontWeight: '500',
  },
  modeSwitcherRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  modePill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#EAF3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePillActive: {
    backgroundColor: BrandTheme.primaryGreen,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandTheme.primaryGreen,
  },
  modePillTextActive: {
    color: '#FFFFFF',
  },
  feederPrereqsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  feederPrereqPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F3FAF5',
    borderWidth: 1,
    borderColor: '#C5DEC9',
  },
  feederPrereqPillDone: {
    backgroundColor: '#E1F3E7',
    borderColor: BrandTheme.primaryGreen,
  },
  feederPrereqPillSelected: {
    borderWidth: 1.8,
    borderColor: BrandTheme.primaryGreen,
  },
  feederPrereqText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: BrandTheme.primaryGreen,
  },
  ans040TreeWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 24,
  },
  ans040TreeHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandTheme.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  treeConnectorText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandTheme.primaryGreen,
  },
  ans040PrereqPairRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  ans040PrereqCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C5D3CB',
    backgroundColor: '#FFFFFF',
    gap: 3,
  },
  ans040PrereqStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandTheme.primaryGreen,
    marginTop: 2,
  },
  dagSafetyBanner: {
    width: '100%',
    backgroundColor: '#E8F6ED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  dagSafetyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F6A42',
    textAlign: 'center',
  },
  tiersViewWrap: {
    width: '100%',
    gap: 10,
    paddingBottom: 28,
  },
  graphTierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE8E0',
    padding: 12,
    gap: 8,
  },
  graphTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  graphTierTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandTheme.primaryGreen,
  },
  graphTierSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: BrandTheme.textSecondary,
  },
  graphTierChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  graphTierChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F2F7F4',
    borderWidth: 1,
    borderColor: '#D6E5DC',
  },
  graphTierChipActive: {
    backgroundColor: BrandTheme.primaryGreen,
    borderColor: BrandTheme.primaryGreen,
  },
  graphTierChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandTheme.textPrimary,
  },
  graphTierChipTextActive: {
    color: '#FFFFFF',
  },
  missingPrereqJumpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  missingPrereqJumpPill: {
    backgroundColor: '#E8F6ED',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#C5E3D0',
  },
  missingPrereqJumpText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: BrandTheme.primaryGreen,
  },
});


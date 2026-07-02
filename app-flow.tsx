{/* ── APP FLOW ── */}
{flow === "app" && (
  <motion.div key="app"
    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
    style={{ width: "390px", minHeight: "844px", position: "relative" }}
  >
    <AnimatePresence mode="wait">

      {/* Property & Project Site Overview — section 1 */}
      {inspFlow === "form" && activeSection?.id === 1 && (
        <PropertyProjectOverviewScreen
          key="property-project-overview"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Job Information — section 30 */}
      {inspFlow === "form" && activeSection?.id === 30 && (
        <JobInformationScreen
          key="job-information"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Description & Overview — section 31 */}
      {inspFlow === "form" && activeSection?.id === 31 && (
        <DescriptionOverviewScreen
          key="description-overview"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Scope, Safety & Limitations — section 2 */}
      {inspFlow === "form" && activeSection?.id === 2 && (
        <ScopeSafetyLimitationsScreen
          key="scope-safety"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Inspection Requirements — section 27 */}
      {inspFlow === "form" && activeSection?.id === 27 && (
        <RequirementsScreen
          key="requirements"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Driveway section — dedicated screen */}
      {inspFlow === "form" && activeSection?.id === 3 && (
        <DrivewaySectionScreen
          key="driveway"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Paving & Paths section — dedicated screen */}
      {inspFlow === "form" && activeSection?.id === 4 && (
        <PavingAndPathsScreen
          key="paving"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Fences & Retaining Walls */}
      {inspFlow === "form" && (activeSection?.id === 5 || activeSection?.id === 6) && (
        <FencesAndWallsScreen
          key="fences"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Garage / Carport */}
      {inspFlow === "form" && activeSection?.id === 7 && (
        <GarageCarportScreen
          key="garage"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Pool / Spa (combined) */}
      {inspFlow === "form" && (activeSection?.id === 24 || activeSection?.id === 25) && (
        <PoolSpaScreen
          key="pool-spa"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Elevations */}
      {inspFlow === "form" && activeSection?.id === 28 && (
        <ElevationsScreen
          key="elevations"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Roof & Chimneys */}
      {inspFlow === "form" && activeSection?.id === 26 && (
        <RoofChimneyScreen
          key="roof-chimney"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Internal Areas */}
      {inspFlow === "form" && activeSection?.id === 29 && (
        <InternalAreasScreen
          key="internal-areas"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Notes / Post Project / Previous Defects */}
      {inspFlow === "form" && activeSection?.id === 32 && (
        <NotesPostProjectScreen
          key="notes-post-project"
          onBack={handleBackFromForm}
          onComplete={handleSectionNext}
          onGoHome={handleGoHome}
        />
      )}

      {/* Inspection form — all other sections */}
      {inspFlow === "form" && activeSection && ![1, 2, 3, 4, 5, 6, 7, 24, 25, 26, 27, 28, 29, 30, 31, 32].includes(activeSection.id) && (
        <InspectionFormScreen
          key={`form-${activeSection.id}`}
          section={activeSection}
          totalSections={ALL_SECTIONS.length}
          onBack={handleBackFromForm}
          onNext={handleSectionNext}
          onSaveDraft={handleBackFromSections}
          onGoHome={handleGoHome}
        />
      )}

      {/* Inspection type & property selector */}
      {inspFlow === "type-select" && (
        <InspectionTypeSelector
          key="type-select"
          onBack={() => setInspFlow(null)}
          onConfirm={handleTypeConfirm}
        />
      )}

      {/* Dilapidation setup wizard */}
      {inspFlow === "setup" && (
        <DilapidationSetupScreen
          key={`setup-${setupStep}`}
          step={setupStep}
          onBack={handleSetupBack}
          onNext={handleSetupNext}
          onFinish={handleSetupFinish}
          onGoHome={handleGoHome}
        />
      )}

      {/* Inspection sections list */}
      {inspFlow === "sections" && !activeSection && (
        <InspectionSectionsScreen
          key="sections"
          onBack={handleBackFromSections}
          onSectionPress={handleSectionPress}
          completedIds={completedSectionIds}
          onGoHome={handleGoHome}
        />
      )}

      {/* Inspection Summary */}
      {inspFlow === "summary" && (
        <InspectionSummaryScreen
          key="summary"
          onBack={() => setInspFlow("sections")}
          onGenerateReport={() => setInspFlow("report")}
          onGoHome={handleGoHome}
          completedIds={completedSectionIds}
        />
      )}

      {/* Report Preview */}
      {inspFlow === "report" && (
        <ReportPreviewScreen
          key="report"
          onBack={() => setInspFlow("summary")}
          onGoHome={handleGoHome}
          onDownload={() => {}}
          onShare={() => {}}
        />
      )}

    </AnimatePresence>
  </motion.div>
)}

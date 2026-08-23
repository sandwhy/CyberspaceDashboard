programs
lessons
teacher lesson progress
teacher certifications
teacher program assignments

## Target: 18 Aug
dashboard:
- [ ] program lessons active inactive status
- [ ] program lesson teacher assignment
- [ ] fix quiz item types
- [ ] quiz manual checking
- [ ] program lessons individual display
- [ ] program lessons operator view

program lesson teacher assignment
get
get personalised (per teacher & per program)
post
put
delete

show data: all lessons (operator), lessons per teacher (teacher)

19 aug
ok so:
make datahub table for: program lessons (shows lessons count, active status, assigned users. actions: create lessons, assign teachers)

# Issues found
- datastore always fetching. Fix: add code that sends current saved data, add variable that activates code to fetch from api



#### DASHBOARD build map ####
[layout] dashboard.vue
    > logo
    > sidebar menu
    > sidebar footer
    > topbar 
        > dynamic admin profile 
    
    = compute admin profile 
    = handleLogout

dashboard index.vue
    > lessons management table
    
    = programSummary: mix dataStore.programs & dataStore.lessons for table population

Schedules.vue
    > <v-sheet> table topbar
        > today button
        > date picker button
        > (openEventDialog) new schedule button
        > viewtype picker
    > <v-calendar> calendar setup
    > <ScheduleForm> dialog point
    > <ReportForm> dialog point
    > <v-menu><v-card> schedules event popupcard
        >(openEventDialog, for edit) button 
        >(openReportDialog) button

    = initialize sutff
    = compute stuff
        = currentMonthLabel
        = currentYear
    = methods
        = refreshSchedules
        = goToToday
        = onDatePicked
        = showEventDetail
        = Dialog Controls
            = openEventDialog (new schedule form open)
            = openReportDialog
        = onMounted
            = dataStore.fetchdata schedules
            = setup focus day

Datahub.vue
    > <DatahubToolbar> dialog point
    > <DatahubTable> dialog point
        =hadle actions such as: goToCalendar, editSchedule, manageReport, editReport, editUser
        (for adding the actions?)
    > <DatahubProgramsGrid> 
    > toggled form popups list
        > <ExportImportForm> dialog point
        > <ReportForm> dialog point
        > <ScheduleForm> dialog point
        > <ProgramForm> dialog point
        > <UserForm> dialog pointi

    = initialisation
        = useAuth 
        = Router
        = config
        = dataStore
    = reactive state initialisation
        = currentView
        = search
        = searchColumn
    = refreshCurrentView() funciton
    = watch(currentView) function, checks if current view is changed 
        = reset reactive states
        = initialize fetch data
    = DialogControls
        = 
    = SelectedData, variables for selected data, to populate forms edit and such
        = selectedUser
        = selectedProgram
        = selectedSchedule
        = selectedReport
    = ComputedProperties
        = isTableView, determines use of table or grid
        = filteredOptions, edited list of accessible tables
        = ActiveHeaders
        = displayedItems
    = Methods of ui & navigation
        = goToCalendar, route to dashboard/schedules
        = handleImportConfirm
        = handleToolbarAction, toolbar export import function
        = openDataDialog
        = openCreateForm
        = editUser
        = editSchedule
        = editProgram
        = editReport

DatahubTable.vue
    > 

CreateLessons.vue

studyprogram [id].vue



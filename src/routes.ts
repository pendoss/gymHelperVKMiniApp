import {
  createHashRouter,
  createPanel,
  createRoot,
  createView,
  RoutesConfig,
} from '@vkontakte/vk-mini-apps-router';

export const DEFAULT_ROOT = 'default_root';

export const DEFAULT_VIEW = 'default_view';

export const DEFAULT_VIEW_PANELS = {
  HOME: 'home',
  WORKOUTS: 'workouts',
  CREATE: 'create',
  EXERCISES: 'exercises',
  EXERCISE_DETAIL: 'exercise-detail',
  WORKOUT_DETAIL: 'workout-detail',
  WORKOUT_EDIT: 'workout-edit',
  PROFILE: 'profile',
  USER_PROFILE: 'user-profile',
  EXERCISE_EDIT: 'exercise-edit',
  PERSIK: 'persik',
} as const;

export const routes = RoutesConfig.create([
  createRoot(DEFAULT_ROOT, [
    createView(DEFAULT_VIEW, [
      createPanel(DEFAULT_VIEW_PANELS.HOME, '/', []),
      createPanel(DEFAULT_VIEW_PANELS.WORKOUTS, `/${DEFAULT_VIEW_PANELS.WORKOUTS}`, []),
      createPanel(DEFAULT_VIEW_PANELS.CREATE, `/${DEFAULT_VIEW_PANELS.CREATE}`, []),
      createPanel(DEFAULT_VIEW_PANELS.EXERCISES, `/${DEFAULT_VIEW_PANELS.EXERCISES}`, []),
      createPanel(DEFAULT_VIEW_PANELS.EXERCISE_DETAIL, `/${DEFAULT_VIEW_PANELS.EXERCISE_DETAIL}/:exerciseId?`, []),
      createPanel(DEFAULT_VIEW_PANELS.WORKOUT_DETAIL, `/${DEFAULT_VIEW_PANELS.WORKOUT_DETAIL}/:workoutId?`, []),
      createPanel(DEFAULT_VIEW_PANELS.WORKOUT_EDIT, `/${DEFAULT_VIEW_PANELS.WORKOUT_EDIT}/:workoutId?`, []),
      createPanel(DEFAULT_VIEW_PANELS.PROFILE, `/${DEFAULT_VIEW_PANELS.PROFILE}`, []),
      createPanel(DEFAULT_VIEW_PANELS.USER_PROFILE, `/${DEFAULT_VIEW_PANELS.USER_PROFILE}/:userId`, []),
      createPanel(DEFAULT_VIEW_PANELS.EXERCISE_EDIT, `/${DEFAULT_VIEW_PANELS.EXERCISE_EDIT}/:exerciseId?`, []),
      createPanel(DEFAULT_VIEW_PANELS.PERSIK, `/${DEFAULT_VIEW_PANELS.PERSIK}`, []),
    ]),
  ]),
]);

export const router = createHashRouter(routes.getRoutes());

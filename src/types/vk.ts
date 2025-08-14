/**
 * VK API типы и интерфейсы
 * Версия: 2.0.0 (совместимо с VK API v5.199)
 * Дата: 2025-08-14
 */

// Базовые типы VK Bridge
export interface VKBridgeConfig {
  appId: number;
  apiVersion: string;
}

export interface VKBridgeError {
  error_type: string;
  error_data: {
    error_code: number;
    error_msg: string;
    request_params: Array<{
      key: string;
      value: string;
    }>;
  };
}

// Типы для VK API методов
export interface VKApiCallParams {
  method: string;
  params: Record<string, any>;
  version?: string;
}

export interface VKApiResponse<T = any> {
  response: T;
  error?: {
    error_code: number;
    error_msg: string;
    request_params: Array<{
      key: string;
      value: string;
    }>;
  };
}

// Пользователи VK
export interface VKUserInfo {
  id: number;
  first_name: string;
  last_name: string;
  deactivated?: string;
  is_closed?: boolean;
  can_access_closed?: boolean;
  about?: string;
  activities?: string;
  bdate?: string;
  blacklisted?: number;
  blacklisted_by_me?: number;
  books?: string;
  can_post?: number;
  can_see_all_posts?: number;
  can_see_audio?: number;
  can_send_friend_request?: number;
  can_write_private_message?: number;
  career?: VKCareer[];
  city?: VKCity;
  common_count?: number;
  connections?: VKConnections;
  contacts?: VKContacts;
  country?: VKCountry;
  crop_photo?: VKCropPhoto;
  domain?: string;
  education?: VKEducation;
  exports?: VKExports;
  followers_count?: number;
  friend_status?: number;
  games?: string;
  has_mobile?: number;
  has_photo?: number;
  home_town?: string;
  interests?: string;
  is_favorite?: number;
  is_friend?: number;
  is_hidden_from_feed?: number;
  last_seen?: VKLastSeen;
  lists?: number[];
  maiden_name?: string;
  military?: VKMilitary[];
  movies?: string;
  music?: string;
  nickname?: string;
  occupation?: VKOccupation;
  online?: number;
  personal?: VKPersonal;
  photo_50?: string;
  photo_100?: string;
  photo_200_orig?: string;
  photo_200?: string;
  photo_400_orig?: string;
  photo_id?: string;
  photo_max?: string;
  photo_max_orig?: string;
  quotes?: string;
  relation?: number;
  relation_partner?: VKUserMin;
  relatives?: VKRelative[];
  schools?: VKSchool[];
  screen_name?: string;
  sex?: number;
  site?: string;
  status?: string;
  timezone?: number;
  trending?: number;
  tv?: string;
  universities?: VKUniversity[];
  verified?: number;
  wall_comments?: number;
  wall_default?: string;
}

export interface VKUserMin {
  id: number;
  first_name: string;
  last_name: string;
  deactivated?: string;
  is_closed?: boolean;
  can_access_closed?: boolean;
}

// Дополнительные типы для VKUserInfo
export interface VKCity {
  id: number;
  title: string;
}

export interface VKCountry {
  id: number;
  title: string;
}

export interface VKCareer {
  group_id?: number;
  company?: string;
  country_id?: number;
  city_id?: number;
  city_name?: string;
  from?: number;
  until?: number;
  position?: string;
}

export interface VKConnections {
  skype?: string;
  facebook?: string;
  facebook_name?: string;
  twitter?: string;
  livejournal?: string;
  instagram?: string;
}

export interface VKContacts {
  mobile_phone?: string;
  home_phone?: string;
}

export interface VKCropPhoto {
  photo: VKPhoto;
  crop: VKCrop;
  rect: VKRect;
}

export interface VKPhoto {
  id: number;
  album_id: number;
  owner_id: number;
  user_id?: number;
  text: string;
  date: number;
  sizes: VKPhotoSize[];
  width?: number;
  height?: number;
}

export interface VKPhotoSize {
  type: string;
  url: string;
  width: number;
  height: number;
}

export interface VKCrop {
  x: number;
  y: number;
  x2: number;
  y2: number;
}

export interface VKRect {
  x: number;
  y: number;
  x2: number;
  y2: number;
}

export interface VKEducation {
  university?: number;
  university_name?: string;
  faculty?: number;
  faculty_name?: string;
  graduation?: number;
}

export interface VKExports {
  facebook?: number;
  livejournal?: number;
  twitter?: number;
  instagram?: number;
}

export interface VKLastSeen {
  time: number;
  platform: number;
}

export interface VKMilitary {
  country_id: number;
  from?: number;
  until?: number;
  unit: string;
  unit_id: number;
}

export interface VKOccupation {
  type: string;
  id?: number;
  name?: string;
}

export interface VKPersonal {
  political?: number;
  langs?: string[];
  religion?: string;
  inspired_by?: string;
  people_main?: number;
  life_main?: number;
  smoking?: number;
  alcohol?: number;
}

export interface VKRelative {
  id?: number;
  name?: string;
  type: string;
}

export interface VKSchool {
  id?: string;
  country?: number;
  city?: number;
  name?: string;
  year_from?: number;
  year_to?: number;
  year_graduated?: number;
  class?: string;
  speciality?: string;
  type?: number;
  type_str?: string;
}

export interface VKUniversity {
  id?: number;
  country?: number;
  city?: number;
  name?: string;
  faculty?: number;
  faculty_name?: string;
  chair?: number;
  chair_name?: string;
  graduation?: number;
  education_form?: string;
  education_status?: string;
}

// Друзья
export interface VKFriendsGetResponse {
  count: number;
  items: VKUserInfo[];
}

export interface VKFriendsGetParams {
  user_id?: number;
  order?: 'name' | 'hints' | 'random';
  list_id?: number;
  count?: number;
  offset?: number;
  fields?: string;
  name_case?: 'nom' | 'gen' | 'dat' | 'acc' | 'ins' | 'abl';
}

// Уведомления
export interface VKNotificationsSendParams {
  user_ids: number[];
  message: string;
  fragment?: string;
  group_id?: number;
  random_id?: number;
  send_immediately?: boolean;
}

export interface VKNotificationsSendResponse {
  user_id: number;
  status: boolean;
  error?: {
    code: number;
    description: string;
  };
}

// Сообщения
export interface VKMessagesSendParams {
  user_id?: number;
  random_id: number;
  peer_id?: number;
  domain?: string;
  chat_id?: number;
  user_ids?: number[];
  message?: string;
  lat?: number;
  long?: number;
  attachment?: string;
  reply_to?: number;
  forward_messages?: number[];
  forward?: string;
  sticker_id?: number;
  group_id?: number;
  keyboard?: string;
  template?: string;
  payload?: string;
  content_source?: string;
  dont_parse_links?: boolean;
  disable_mentions?: boolean;
  intent?: string;
  subscribe_id?: number;
}

// Группы/сообщества
export interface VKGroup {
  id: number;
  name: string;
  screen_name: string;
  is_closed: number;
  type: 'group' | 'page' | 'event';
  is_admin?: number;
  is_member?: number;
  is_advertiser?: number;
  photo_50?: string;
  photo_100?: string;
  photo_200?: string;
}

// Приложения
export interface VKApp {
  id: number;
  title: string;
  author_owner_id?: number;
  is_in_catalog?: number;
  type: 'app' | 'game' | 'site' | 'standalone';
  author_url?: string;
  banner_1120?: string;
  banner_560?: string;
  icon_139?: string;
  icon_150?: string;
  icon_278?: string;
  icon_576?: string;
  screenshot_1280?: string;
  screenshot_640?: string;
}

// Обработка ошибок VK API
export interface VKErrorInfo {
  error_code: number;
  error_msg: string;
  request_params: Array<{
    key: string;
    value: string;
  }>;
}

// Константы VK API
export const VK_API_VERSION = '5.199';

export const VK_ERROR_CODES = {
  UNKNOWN_ERROR: 1,
  APP_OFF: 2,
  UNKNOWN_METHOD: 3,
  INVALID_SIGNATURE: 4,
  USER_AUTHORIZATION_FAILED: 5,
  TOO_MANY_REQUESTS: 6,
  PERMISSION_DENIED: 7,
  INVALID_REQUEST: 8,
  FLOOD_CONTROL: 9,
  INTERNAL_SERVER_ERROR: 10,
  TEST_MODE: 11,
  CAPTCHA_NEEDED: 14,
  ACCESS_DENIED: 15,
  HTTPS_REQUIRED: 16,
  VALIDATION_REQUIRED: 17,
  USER_DELETED_OR_BANNED: 18,
  CONTENT_BLOCKED: 19,
  PERMISSION_DENIED_FOR_NON_STANDALONE: 20,
  PERMISSION_DENIED_FOR_STANDALONE_AND_OPEN_API: 21,
  METHOD_DISABLED: 23,
  CONFIRMATION_REQUIRED: 24,
  GROUP_AUTH_FAILED: 27,
  APP_AUTH_FAILED: 28,
  RATE_LIMIT_REACHED: 29,
  PRIVATE_PROFILE: 30,
  NOT_IMPLEMENTED_YET: 33,
  USER_NOT_FOUND: 113,
  INVALID_USER_ID: 114,
  INVALID_TIMESTAMP: 150,
  INVALID_ALBUM_ID: 200,
  INVALID_PHOTO: 201,
  ACCESS_TO_ALBUM_DENIED: 203,
  INVALID_GROUP_ID: 203,
  ACCESS_TO_GROUP_DENIED: 260,
  ALBUM_IS_FULL: 300,
  INVALID_PHONE_NUMBER: 1000,
  APP_REQUEST_LIMIT_REACHED: 1001,
} as const;

export type VKErrorCode = typeof VK_ERROR_CODES[keyof typeof VK_ERROR_CODES];

// VK Bridge события
export interface VKBridgeSubscribeHandler {
  (methodName: string): void;
}

export interface VKBridgeUnsubscribeHandler {
  (methodName: string): void;
}

// Специфичные методы для мини-приложений
export interface VKMiniAppGetLaunchParamsResponse {
  vk_user_id: number;
  vk_app_id: number;
  vk_is_app_user: number;
  vk_are_notifications_enabled: number;
  vk_language: string;
  vk_ref: string;
  vk_access_token_settings: string;
  vk_group_id?: number;
  vk_viewer_group_role?: string;
  vk_platform: string;
  vk_is_favorite: number;
  vk_ts: number;
  sign: string;
}

export interface VKStorageKeys {
  [key: string]: string;
}

export interface VKStorageGetResponse {
  keys: Array<{
    key: string;
    value: string;
  }>;
}

// Геолокация
export interface VKGeolocationData {
  lat: number;
  long: number;
  accuracy?: number;
  city?: VKCity;
  country?: VKCountry;
}

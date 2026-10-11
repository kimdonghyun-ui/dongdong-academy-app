/**
 * settingsStore 전용 변환기
 * Strapi academy-teacher-settings ↔ 앱 AcademySettings
 *
 * 선생님마다 설정 1건(Collection + owner).
 * documentId는 수정용으로 store가 따로 들고 있다.
 */
import type { AcademySettings, StrapiDocument } from "@/type"

export type TeacherSettingDoc = StrapiDocument<AcademySettings>

export const EMPTY_SETTINGS: AcademySettings = {
  academyName: "",
  teacherName: "",
  phone: "",
  defaultPaymentDay: 10,
  noticeFooter: "",
}

export function toSettings(doc: TeacherSettingDoc): AcademySettings {
  return {
    academyName: doc.academyName ?? "",
    teacherName: doc.teacherName ?? "",
    phone: doc.phone ?? "",
    defaultPaymentDay: doc.defaultPaymentDay ?? 10,
    noticeFooter: doc.noticeFooter ?? "",
  }
}

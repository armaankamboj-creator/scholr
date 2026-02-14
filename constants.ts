import { ClassLevel, Subject } from "./types";

export const SUBJECTS_BY_CLASS: Record<ClassLevel, Subject[]> = {
  [ClassLevel.Class8]: [Subject.Math, Subject.Science, Subject.SocialScience, Subject.English],
  [ClassLevel.Class9]: [Subject.Math, Subject.Science, Subject.SocialScience, Subject.English],
  [ClassLevel.Class10]: [Subject.Math, Subject.Science, Subject.SocialScience, Subject.English, Subject.ComputerScience],
  [ClassLevel.Class11]: [Subject.Physics, Subject.Chemistry, Subject.Math, Subject.Biology, Subject.English, Subject.ComputerScience, Subject.Economics, Subject.Accountancy, Subject.BusinessStudies],
  [ClassLevel.Class12]: [Subject.Physics, Subject.Chemistry, Subject.Math, Subject.Biology, Subject.English, Subject.ComputerScience, Subject.Economics, Subject.Accountancy, Subject.BusinessStudies],
};

export const APP_NAME = "Scholr®";
export const TRADEMARK_TEXT = `© 2026 ${APP_NAME} All Rights Reserved. Registered Trademark.`;

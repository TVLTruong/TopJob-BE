// Gender Enum
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

// Education Level Enum
export enum EducationLevel {
  HIGH_SCHOOL = 'high_school',
  ASSOCIATE_DEGREE = 'associate_degree',
  BACHELOR_DEGREE = 'bachelor_degree',
  MASTER_DEGREE = 'master_degree',
  DOCTORAL_DEGREE = 'doctoral_degree',
  OTHER = 'other',
}

// Experience Level Enum
export enum ExperienceLevel {
  INTERN = 'intern', // Thực tập sinh
  FRESHER = 'fresher', // Mới ra trường (0-1 năm)
  JUNIOR = 'junior', // Junior (1-3 năm)
  MIDDLE = 'middle', // Middle (3-5 năm)
  SENIOR = 'senior', // Senior (5+ năm)
  LEAD = 'lead', // Team Lead
  MANAGER = 'manager', // Manager
}

// Gender Labels (for display)
export const GenderLabel: Record<Gender, string> = {
  [Gender.MALE]: 'Nam',
  [Gender.FEMALE]: 'Nữ',
  [Gender.OTHER]: 'Khác',
};

// Education Level Labels (for display)
export const EducationLevelLabel: Record<EducationLevel, string> = {
  [EducationLevel.HIGH_SCHOOL]: 'Trung học phổ thông',
  [EducationLevel.ASSOCIATE_DEGREE]: 'Cao đẳng',
  [EducationLevel.BACHELOR_DEGREE]: 'Đại học',
  [EducationLevel.MASTER_DEGREE]: 'Thạc sĩ',
  [EducationLevel.DOCTORAL_DEGREE]: 'Tiến sĩ',
  [EducationLevel.OTHER]: 'Khác',
};

// Experience Level Labels (for display)
export const ExperienceLevelLabel: Record<ExperienceLevel, string> = {
  [ExperienceLevel.INTERN]: 'Thực tập sinh',
  [ExperienceLevel.FRESHER]: 'Mới ra trường (0-1 năm)',
  [ExperienceLevel.JUNIOR]: 'Junior (1-3 năm)',
  [ExperienceLevel.MIDDLE]: 'Middle (3-5 năm)',
  [ExperienceLevel.SENIOR]: 'Senior (5+ năm)',
  [ExperienceLevel.LEAD]: 'Team Lead',
  [ExperienceLevel.MANAGER]: 'Manager',
};

// Experience Level Years Range
export const ExperienceLevelYears: Record<
  ExperienceLevel,
  { min: number; max: number | null }
> = {
  [ExperienceLevel.INTERN]: { min: 0, max: 0 },
  [ExperienceLevel.FRESHER]: { min: 0, max: 1 },
  [ExperienceLevel.JUNIOR]: { min: 1, max: 3 },
  [ExperienceLevel.MIDDLE]: { min: 3, max: 5 },
  [ExperienceLevel.SENIOR]: { min: 5, max: null },
  [ExperienceLevel.LEAD]: { min: 5, max: null },
  [ExperienceLevel.MANAGER]: { min: 7, max: null },
};

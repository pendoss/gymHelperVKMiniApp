/**
 * Система валидации данных
 * Версия: 2.0.0
 * Дата: 2025-08-14
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ValidationRule<T = any> {
  validate: (value: T, context?: any) => ValidationResult;
  message?: string;
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: ValidationRule[];
  transform?: (value: any) => any;
}

export interface ValidationSchema {
  [key: string]: FieldValidation;
}

// Базовые правила валидации
export const ValidationRules = {
  /**
   * Проверка на обязательность поля
   */
  required: (message?: string): ValidationRule => ({
    validate: (value: any) => {
      const isEmpty = value === null || 
                     value === undefined || 
                     value === '' || 
                     (Array.isArray(value) && value.length === 0);
      
      return {
        isValid: !isEmpty,
        errors: isEmpty ? [message || 'Поле обязательно для заполнения'] : []
      };
    }
  }),

  /**
   * Проверка минимальной длины
   */
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => {
      if (typeof value !== 'string') {
        return { isValid: false, errors: ['Значение должно быть строкой'] };
      }
      
      const isValid = value.length >= min;
      return {
        isValid,
        errors: isValid ? [] : [message || `Минимальная длина: ${min} символов`]
      };
    }
  }),

  /**
   * Проверка максимальной длины
   */
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => {
      if (typeof value !== 'string') {
        return { isValid: false, errors: ['Значение должно быть строкой'] };
      }
      
      const isValid = value.length <= max;
      return {
        isValid,
        errors: isValid ? [] : [message || `Максимальная длина: ${max} символов`]
      };
    }
  }),

  /**
   * Проверка по регулярному выражению
   */
  pattern: (regex: RegExp, message?: string): ValidationRule => ({
    validate: (value: string) => {
      if (typeof value !== 'string') {
        return { isValid: false, errors: ['Значение должно быть строкой'] };
      }
      
      const isValid = regex.test(value);
      return {
        isValid,
        errors: isValid ? [] : [message || 'Неверный формат']
      };
    }
  }),

  /**
   * Проверка email
   */
  email: (message?: string): ValidationRule => ({
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(value);
      
      return {
        isValid,
        errors: isValid ? [] : [message || 'Неверный формат email']
      };
    }
  }),

  /**
   * Проверка номера телефона
   */
  phone: (message?: string): ValidationRule => ({
    validate: (value: string) => {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanValue = value.replace(/[\s\-\(\)]/g, '');
      const isValid = phoneRegex.test(cleanValue);
      
      return {
        isValid,
        errors: isValid ? [] : [message || 'Неверный формат телефона']
      };
    }
  }),

  /**
   * Проверка числового значения
   */
  number: (message?: string): ValidationRule => ({
    validate: (value: any) => {
      const numValue = Number(value);
      const isValid = !isNaN(numValue) && isFinite(numValue);
      
      return {
        isValid,
        errors: isValid ? [] : [message || 'Значение должно быть числом']
      };
    }
  }),

  /**
   * Проверка минимального числового значения
   */
  min: (minValue: number, message?: string): ValidationRule => ({
    validate: (value: any) => {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { isValid: false, errors: ['Значение должно быть числом'] };
      }
      
      const isValid = numValue >= minValue;
      return {
        isValid,
        errors: isValid ? [] : [message || `Минимальное значение: ${minValue}`]
      };
    }
  }),

  /**
   * Проверка максимального числового значения
   */
  max: (maxValue: number, message?: string): ValidationRule => ({
    validate: (value: any) => {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { isValid: false, errors: ['Значение должно быть числом'] };
      }
      
      const isValid = numValue <= maxValue;
      return {
        isValid,
        errors: isValid ? [] : [message || `Максимальное значение: ${maxValue}`]
      };
    }
  }),

  /**
   * Проверка диапазона значений
   */
  range: (min: number, max: number, message?: string): ValidationRule => ({
    validate: (value: any) => {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { isValid: false, errors: ['Значение должно быть числом'] };
      }
      
      const isValid = numValue >= min && numValue <= max;
      return {
        isValid,
        errors: isValid ? [] : [message || `Значение должно быть от ${min} до ${max}`]
      };
    }
  }),

  /**
   * Проверка даты
   */
  date: (message?: string): ValidationRule => ({
    validate: (value: any) => {
      let dateValue: Date;
      
      if (value instanceof Date) {
        dateValue = value;
      } else if (typeof value === 'string') {
        dateValue = new Date(value);
      } else {
        return { isValid: false, errors: [message || 'Неверный формат даты'] };
      }
      
      const isValid = !isNaN(dateValue.getTime());
      return {
        isValid,
        errors: isValid ? [] : [message || 'Неверный формат даты']
      };
    }
  }),

  /**
   * Проверка будущей даты
   */
  futureDate: (message?: string): ValidationRule => ({
    validate: (value: any) => {
      const dateRule = ValidationRules.date();
      const dateValidation = dateRule.validate(value);
      
      if (!dateValidation.isValid) {
        return dateValidation;
      }
      
      const date = new Date(value);
      const now = new Date();
      const isValid = date > now;
      
      return {
        isValid,
        errors: isValid ? [] : [message || 'Дата должна быть в будущем']
      };
    }
  }),

  /**
   * Проверка времени в формате HH:mm
   */
  time: (message?: string): ValidationRule => ({
    validate: (value: string) => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const isValid = timeRegex.test(value);
      
      return {
        isValid,
        errors: isValid ? [] : [message || 'Неверный формат времени (HH:mm)']
      };
    }
  }),

  /**
   * Проверка URL
   */
  url: (message?: string): ValidationRule => ({
    validate: (value: string) => {
      try {
        new URL(value);
        return { isValid: true, errors: [] };
      } catch {
        return {
          isValid: false,
          errors: [message || 'Неверный формат URL']
        };
      }
    }
  }),

  /**
   * Проверка массива
   */
  array: (minItems?: number, maxItems?: number, message?: string): ValidationRule => ({
    validate: (value: any) => {
      if (!Array.isArray(value)) {
        return { isValid: false, errors: ['Значение должно быть массивом'] };
      }
      
      const errors: string[] = [];
      
      if (minItems !== undefined && value.length < minItems) {
        errors.push(message || `Минимум элементов: ${minItems}`);
      }
      
      if (maxItems !== undefined && value.length > maxItems) {
        errors.push(message || `Максимум элементов: ${maxItems}`);
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  })
};

// Специфичные схемы валидации для приложения
export const validationSchemas = {
  /**
   * Валидация тренировки
   */
  workout: {
    title: {
      required: true,
      minLength: 2,
      maxLength: 100,
      custom: [ValidationRules.required('Название тренировки обязательно')]
    },
    description: {
      maxLength: 500
    },
    date: {
      required: true,
      custom: [
        ValidationRules.required('Дата тренировки обязательна'),
        ValidationRules.date('Неверный формат даты'),
        ValidationRules.futureDate('Тренировка должна быть запланирована на будущее')
      ]
    },
    startTime: {
      required: true,
      custom: [
        ValidationRules.required('Время начала обязательно'),
        ValidationRules.time('Неверный формат времени')
      ]
    },
    estimatedDuration: {
      required: true,
      custom: [
        ValidationRules.required('Продолжительность обязательна'),
        ValidationRules.number('Продолжительность должна быть числом'),
        ValidationRules.range(15, 480, 'Продолжительность от 15 минут до 8 часов')
      ]
    },
    exercises: {
      required: true,
      custom: [
        ValidationRules.required('Выберите упражнения'),
        ValidationRules.array(1, 20, 'От 1 до 20 упражнений')
      ]
    }
  },

  /**
   * Валидация упражнения
   */
  exercise: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      custom: [ValidationRules.required('Название упражнения обязательно')]
    },
    description: {
      maxLength: 1000
    },
    muscleGroups: {
      required: true,
      custom: [
        ValidationRules.required('Выберите группы мышц'),
        ValidationRules.array(1, 5, 'От 1 до 5 групп мышц')
      ]
    },
    difficulty: {
      required: true,
      custom: [ValidationRules.required('Выберите уровень сложности')]
    },
    instructions: {
      required: true,
      custom: [
        ValidationRules.required('Добавьте инструкции'),
        ValidationRules.array(1, 10, 'От 1 до 10 инструкций')
      ]
    }
  },

  /**
   * Валидация сета упражнения
   */
  exerciseSet: {
    targetReps: {
      custom: [
        ValidationRules.number('Количество повторений должно быть числом'),
        ValidationRules.range(1, 100, 'От 1 до 100 повторений')
      ]
    },
    targetWeight: {
      custom: [
        ValidationRules.number('Вес должен быть числом'),
        ValidationRules.min(0, 'Вес не может быть отрицательным')
      ]
    },
    targetDuration: {
      custom: [
        ValidationRules.number('Продолжительность должна быть числом'),
        ValidationRules.range(1, 3600, 'От 1 секунды до 1 часа')
      ]
    },
    restTime: {
      custom: [
        ValidationRules.number('Время отдыха должно быть числом'),
        ValidationRules.range(0, 600, 'От 0 до 10 минут')
      ]
    }
  },

  /**
   * Валидация приглашения
   */
  invitation: {
    workoutId: {
      required: true,
      custom: [ValidationRules.required('ID тренировки обязателен')]
    },
    friendIds: {
      required: true,
      custom: [
        ValidationRules.required('Выберите друзей'),
        ValidationRules.array(1, 10, 'Можно пригласить от 1 до 10 друзей')
      ]
    },
    message: {
      maxLength: 200
    }
  },

  /**
   * Валидация профиля пользователя
   */
  userProfile: {
    firstName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      custom: [ValidationRules.required('Имя обязательно')]
    },
    lastName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      custom: [ValidationRules.required('Фамилия обязательна')]
    },
    city: {
      maxLength: 100
    }
  }
};

/**
 * Основной класс валидатора
 */
class Validator {
  /**
   * Валидация одного поля
   */
  static validateField(
    value: any, 
    fieldValidation: FieldValidation, 
    context?: any
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Трансформация значения
    let processedValue = value;
    if (fieldValidation.transform) {
      processedValue = fieldValidation.transform(value);
    }

    // Проверка на обязательность
    if (fieldValidation.required) {
      const requiredResult = ValidationRules.required().validate(processedValue);
      if (!requiredResult.isValid) {
        errors.push(...requiredResult.errors);
        // Если поле обязательное и пустое, дальше не проверяем
        return { isValid: false, errors, warnings };
      }
    }

    // Если значение пустое и поле не обязательное, считаем валидным
    if (processedValue === null || processedValue === undefined || processedValue === '') {
      return { isValid: true, errors: [], warnings };
    }

    // Проверка минимальной длины
    if (fieldValidation.minLength) {
      const minLengthResult = ValidationRules.minLength(fieldValidation.minLength).validate(processedValue);
      if (!minLengthResult.isValid) {
        errors.push(...minLengthResult.errors);
      }
    }

    // Проверка максимальной длины
    if (fieldValidation.maxLength) {
      const maxLengthResult = ValidationRules.maxLength(fieldValidation.maxLength).validate(processedValue);
      if (!maxLengthResult.isValid) {
        errors.push(...maxLengthResult.errors);
      }
    }

    // Проверка по паттерну
    if (fieldValidation.pattern) {
      const patternResult = ValidationRules.pattern(fieldValidation.pattern).validate(processedValue);
      if (!patternResult.isValid) {
        errors.push(...patternResult.errors);
      }
    }

    // Кастомные правила
    if (fieldValidation.custom) {
      for (const rule of fieldValidation.custom) {
        const customResult = rule.validate(processedValue, context);
        if (!customResult.isValid) {
          errors.push(...customResult.errors);
        }
        if (customResult.warnings) {
          warnings.push(...customResult.warnings);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Валидация объекта по схеме
   */
  static validateObject(
    data: Record<string, any>, 
    schema: ValidationSchema, 
    context?: any
  ): ValidationResult & { fieldErrors: Record<string, string[]> } {
    const fieldErrors: Record<string, string[]> = {};
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const [fieldName, fieldValidation] of Object.entries(schema)) {
      const fieldValue = data[fieldName];
      const fieldResult = this.validateField(fieldValue, fieldValidation, context);
      
      if (!fieldResult.isValid) {
        fieldErrors[fieldName] = fieldResult.errors;
        allErrors.push(...fieldResult.errors);
      }
      
      if (fieldResult.warnings) {
        allWarnings.push(...fieldResult.warnings);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
      fieldErrors
    };
  }

  /**
   * Валидация тренировки
   */
  static validateWorkout(workoutData: any): ValidationResult & { fieldErrors: Record<string, string[]> } {
    return this.validateObject(workoutData, validationSchemas.workout);
  }

  /**
   * Валидация упражнения
   */
  static validateExercise(exerciseData: any): ValidationResult & { fieldErrors: Record<string, string[]> } {
    return this.validateObject(exerciseData, validationSchemas.exercise);
  }

  /**
   * Валидация приглашения
   */
  static validateInvitation(invitationData: any): ValidationResult & { fieldErrors: Record<string, string[]> } {
    return this.validateObject(invitationData, validationSchemas.invitation);
  }

  /**
   * Валидация профиля пользователя
   */
  static validateUserProfile(profileData: any): ValidationResult & { fieldErrors: Record<string, string[]> } {
    return this.validateObject(profileData, validationSchemas.userProfile);
  }

  /**
   * Создание кастомного правила валидации
   */
  static createCustomRule(
    validateFn: (value: any, context?: any) => boolean,
    message: string
  ): ValidationRule {
    return {
      validate: (value: any, context?: any) => {
        const isValid = validateFn(value, context);
        return {
          isValid,
          errors: isValid ? [] : [message]
        };
      }
    };
  }
}

export default Validator;

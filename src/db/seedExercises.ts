import type { Exercise, MuscleGroup } from '../types'

export function defaultWeightStep(muscleGroup: MuscleGroup): number {
  return muscleGroup === 'legs' || muscleGroup === 'back' ? 5 : 2.5
}

function exercise(
  name: string,
  muscleGroup: MuscleGroup,
  isCompound: boolean,
): Exercise {
  return {
    name,
    muscleGroup,
    isCompound,
    weightStep: defaultWeightStep(muscleGroup),
  }
}

export const SEED_EXERCISES: Exercise[] = [
  exercise('Присед со штангой', 'legs', true),
  exercise('Жим ногами', 'legs', true),
  exercise('Румынская тяга', 'legs', true),
  exercise('Разгибание ног', 'legs', false),
  exercise('Сгибание ног', 'legs', false),
  exercise('Подъём на носки', 'legs', false),

  exercise('Жим штанги лёжа', 'chest', true),
  exercise('Жим гантелей лёжа', 'chest', true),
  exercise('Жим в наклоне', 'chest', true),
  exercise('Разводка гантелей', 'chest', false),
  exercise('Отжимания', 'chest', true),
  exercise('Кроссовер', 'chest', false),

  exercise('Становая тяга', 'back', true),
  exercise('Тяга штанги в наклоне', 'back', true),
  exercise('Подтягивания', 'back', true),
  exercise('Тяга верхнего блока', 'back', true),
  exercise('Тяга гантели в наклоне', 'back', true),
  exercise('Гиперэкстензия', 'back', false),

  exercise('Жим штанги стоя', 'shoulders', true),
  exercise('Жим гантелей сидя', 'shoulders', true),
  exercise('Махи гантелями в стороны', 'shoulders', false),
  exercise('Разведения в наклоне', 'shoulders', false),
  exercise('Тяга к подбородку', 'shoulders', true),
  exercise('Жим Арнольда', 'shoulders', true),

  exercise('Подъём штанги на бицепс', 'arms', false),
  exercise('Сгибания рук с гантелями', 'arms', false),
  exercise('Французский жим', 'arms', false),
  exercise('Разгибание на трицепс на блоке', 'arms', false),
  exercise('Отжимания на брусьях', 'arms', true),
  exercise('Молотки', 'arms', false),
]

export const CYCLE_EXERCISE_NAMES = {
  squat: 'Присед со штангой',
  bench: 'Жим штанги лёжа',
  deadlift: 'Становая тяга',
} as const

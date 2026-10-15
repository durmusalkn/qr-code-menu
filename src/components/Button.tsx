import { Pressable, Text } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`items-center rounded-2xl px-5 py-4 active:opacity-70 ${
        primary ? 'bg-neutral-900' : 'bg-transparent'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className={`text-base font-semibold ${primary ? 'text-white' : 'text-neutral-500'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

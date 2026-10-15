import type { ReactNode } from 'react';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  /** Defaults to all edges; screens with a navigation header usually drop `top`. */
  edges?: Edge[];
}

export function Screen({ children, edges }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-white">
      {children}
    </SafeAreaView>
  );
}

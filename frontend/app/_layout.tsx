import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Tükenmişlik Analizi',
          headerStyle: { backgroundColor: '#E8F0F4' },
          headerTintColor: '#0F3D4C',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
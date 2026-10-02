import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'http://10.0.2.2:8000/predict';

type FieldType = 'number' | 'select';

interface FieldConfig {
  key: keyof BurnoutFormData;
  label: string;
  hint?: string;
  type: FieldType;
  keyboard?: 'numeric' | 'decimal-pad';
  options?: string[];
}

interface BurnoutFormData {
  Age: string;
  Gender: string;
  Education_Level: string;
  Employment_Status: string;
  Monthly_Income_USD: string;
  Work_Hours_Per_Week: string;
  Remote_Work: string;
  Job_Satisfaction: string;
  Work_Life_Balance: string;
  Sleep_Hours: string;
  Sleep_Quality: string;
  Stress_Level: string;
  Anxiety_Score: string;
  Depression_Score: string;
  Mood_Score: string;
  Emotional_Stability: string;
  Physical_Activity_Hours: string;
  Exercise_Frequency: string;
  Meditation_Minutes: string;
  Screen_Time_Hours: string;
  Social_Media_Hours: string;
  Gaming_Hours: string;
  Coffee_Cups_Per_Day: string;
  Alcohol_Consumption: string;
  Smoking: string;
  Healthy_Diet: string;
  Chronic_Stress: string;
  Family_History_Mental_Illness: string;
  Therapy_Attendance: string;
  Support_System: string;
  Life_Satisfaction: string;
  Productivity_Score: string;
  Absenteeism_Days: string;
}

interface PredictionResponse {
  burnout_score: number;
  risk_level: string;
  risk_label: string;
  risk_color: string;
}

interface StepConfig {
  title: string;
  subtitle: string;
  fields: FieldConfig[];
}

const YES_NO = ['Yes', 'No'];

const STEPS: StepConfig[] = [
  {
    title: 'Kişisel Bilgiler',
    subtitle: 'Temel profil bilgilerinizi girin.',
    fields: [
      { key: 'Age', label: 'Yaş', type: 'number', keyboard: 'decimal-pad', hint: 'Örn: 28' },
      {
        key: 'Gender',
        label: 'Cinsiyet',
        type: 'select',
        options: ['Female', 'Male', 'Other'],
      },
      {
        key: 'Education_Level',
        label: 'Eğitim Seviyesi',
        type: 'select',
        options: ['High School', 'Diploma', 'Bachelor', 'Master', 'PhD'],
      },
      {
        key: 'Employment_Status',
        label: 'İstihdam Durumu',
        type: 'select',
        options: ['Employed', 'Self-Employed', 'Student', 'Unemployed'],
      },
      {
        key: 'Monthly_Income_USD',
        label: 'Aylık Gelir (USD)',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: 'Örn: 4500',
      },
      {
        key: 'Work_Hours_Per_Week',
        label: 'Haftalık Çalışma Saati',
        type: 'number',
        keyboard: 'numeric',
        hint: 'Örn: 40',
      },
    ],
  },
  {
    title: 'İş & Uyku',
    subtitle: 'Çalışma düzeni ve uyku alışkanlıklarınız.',
    fields: [
      { key: 'Remote_Work', label: 'Uzaktan Çalışma', type: 'select', options: YES_NO },
      {
        key: 'Job_Satisfaction',
        label: 'İş Memnuniyeti',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: '1 – 10',
      },
      {
        key: 'Work_Life_Balance',
        label: 'İş-Yaşam Dengesi',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: '1 – 10',
      },
      {
        key: 'Sleep_Hours',
        label: 'Uyku Süresi (saat)',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: 'Örn: 7',
      },
      {
        key: 'Sleep_Quality',
        label: 'Uyku Kalitesi',
        type: 'select',
        options: ['Poor', 'Average', 'Good', 'Excellent'],
      },
      {
        key: 'Stress_Level',
        label: 'Stres Seviyesi',
        type: 'select',
        options: ['Low', 'Moderate', 'High'],
      },
    ],
  },
  {
    title: 'Ruh Hali & Aktivite',
    subtitle: 'Duygusal durum ve fiziksel aktivite.',
    fields: [
      {
        key: 'Anxiety_Score',
        label: 'Anksiyete Skoru',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: '0 – 100',
      },
      {
        key: 'Depression_Score',
        label: 'Depresyon Skoru',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: '0 – 100',
      },
      {
        key: 'Mood_Score',
        label: 'Ruh Hali Skoru',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: '1 – 10',
      },
      {
        key: 'Emotional_Stability',
        label: 'Duygusal Denge',
        type: 'number',
        keyboard: 'numeric',
        hint: '1 – 10',
      },
      {
        key: 'Physical_Activity_Hours',
        label: 'Haftalık Spor (saat)',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: 'Örn: 3',
      },
      {
        key: 'Exercise_Frequency',
        label: 'Egzersiz Sıklığı',
        type: 'select',
        options: ['Never', 'Rarely', 'Weekly', 'Daily'],
      },
    ],
  },
  {
    title: 'Dijital & Alışkanlıklar',
    subtitle: 'Ekran süresi, kahve ve benzeri alışkanlıklar.',
    fields: [
      {
        key: 'Meditation_Minutes',
        label: 'Meditasyon (dk/gün)',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: 'Örn: 10',
      },
      {
        key: 'Screen_Time_Hours',
        label: 'Ekran Süresi (saat/gün)',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: 'Örn: 6',
      },
      {
        key: 'Social_Media_Hours',
        label: 'Sosyal Medya (saat/gün)',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: 'Örn: 2',
      },
      {
        key: 'Gaming_Hours',
        label: 'Oyun (saat/gün)',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: 'Örn: 1',
      },
      {
        key: 'Coffee_Cups_Per_Day',
        label: 'Günlük Kahve (fincan)',
        type: 'number',
        keyboard: 'numeric',
        hint: 'Örn: 2',
      },
      {
        key: 'Alcohol_Consumption',
        label: 'Alkol Tüketimi',
        type: 'select',
        options: YES_NO,
      },
    ],
  },
  {
    title: 'Sağlık & Destek',
    subtitle: 'Yaşam tarzı ve destek sisteminiz.',
    fields: [
      { key: 'Smoking', label: 'Sigara', type: 'select', options: YES_NO },
      { key: 'Healthy_Diet', label: 'Sağlıklı Beslenme', type: 'select', options: YES_NO },
      { key: 'Chronic_Stress', label: 'Kronik Stres', type: 'select', options: YES_NO },
      {
        key: 'Family_History_Mental_Illness',
        label: 'Ailede Ruh Sağlığı Öyküsü',
        type: 'select',
        options: YES_NO,
      },
      {
        key: 'Therapy_Attendance',
        label: 'Terapiye Gitme',
        type: 'select',
        options: YES_NO,
      },
      {
        key: 'Support_System',
        label: 'Destek Sistemi',
        type: 'select',
        options: ['Poor', 'Average', 'Good', 'Excellent'],
      },
    ],
  },
  {
    title: 'Yaşam Sonuçları',
    subtitle: 'Son birkaç bilgi, ardından risk analizi.',
    fields: [
      {
        key: 'Life_Satisfaction',
        label: 'Yaşam Memnuniyeti',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: '1 – 10',
      },
      {
        key: 'Productivity_Score',
        label: 'Verimlilik Skoru',
        type: 'number',
        keyboard: 'decimal-pad',
        hint: '0 – 100',
      },
      {
        key: 'Absenteeism_Days',
        label: 'Devamsızlık (gün/ay)',
        type: 'number',
        keyboard: 'numeric',
        hint: 'Örn: 2',
      },
    ],
  },
];

const EMPTY_FORM: BurnoutFormData = {
  Age: '',
  Gender: '',
  Education_Level: '',
  Employment_Status: '',
  Monthly_Income_USD: '',
  Work_Hours_Per_Week: '',
  Remote_Work: '',
  Job_Satisfaction: '',
  Work_Life_Balance: '',
  Sleep_Hours: '',
  Sleep_Quality: '',
  Stress_Level: '',
  Anxiety_Score: '',
  Depression_Score: '',
  Mood_Score: '',
  Emotional_Stability: '',
  Physical_Activity_Hours: '',
  Exercise_Frequency: '',
  Meditation_Minutes: '',
  Screen_Time_Hours: '',
  Social_Media_Hours: '',
  Gaming_Hours: '',
  Coffee_Cups_Per_Day: '',
  Alcohol_Consumption: '',
  Smoking: '',
  Healthy_Diet: '',
  Chronic_Stress: '',
  Family_History_Mental_Illness: '',
  Therapy_Attendance: '',
  Support_System: '',
  Life_Satisfaction: '',
  Productivity_Score: '',
  Absenteeism_Days: '',
};

const RISK_COLORS: Record<string, string> = {
  green: '#1B7F4E',
  orange: '#C56A1A',
  red: '#C0392B',
};

function OptionChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function BurnoutScreen() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [formData, setFormData] = useState<BurnoutFormData>(EMPTY_FORM);
  const scrollRef = useRef<ScrollView>(null);

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const filledCount = useMemo(
    () => Object.values(formData).filter((v) => v.trim() !== '').length,
    [formData]
  );

  const handleChange = (field: keyof BurnoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    const missing = currentStep.fields.filter(
      (field) => !formData[field.key].trim()
    );
    if (missing.length > 0) {
      Alert.alert(
        'Eksik bilgi',
        `Lütfen şu alanları doldurun:\n${missing.map((f) => `• ${f.label}`).join('\n')}`
      );
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const goBack = () => {
    if (result) {
      setResult(null);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handlePredict = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        Age: parseFloat(formData.Age),
        Gender: formData.Gender,
        Education_Level: formData.Education_Level,
        Employment_Status: formData.Employment_Status,
        Monthly_Income_USD: parseFloat(formData.Monthly_Income_USD),
        Work_Hours_Per_Week: parseInt(formData.Work_Hours_Per_Week, 10),
        Remote_Work: formData.Remote_Work,
        Job_Satisfaction: parseFloat(formData.Job_Satisfaction),
        Work_Life_Balance: parseFloat(formData.Work_Life_Balance),
        Sleep_Hours: parseFloat(formData.Sleep_Hours),
        Sleep_Quality: formData.Sleep_Quality,
        Stress_Level: formData.Stress_Level,
        Anxiety_Score: parseFloat(formData.Anxiety_Score),
        Depression_Score: parseFloat(formData.Depression_Score),
        Mood_Score: parseFloat(formData.Mood_Score),
        Emotional_Stability: parseInt(formData.Emotional_Stability, 10),
        Physical_Activity_Hours: parseFloat(formData.Physical_Activity_Hours),
        Exercise_Frequency: formData.Exercise_Frequency,
        Meditation_Minutes: parseFloat(formData.Meditation_Minutes),
        Screen_Time_Hours: parseFloat(formData.Screen_Time_Hours),
        Social_Media_Hours: parseFloat(formData.Social_Media_Hours),
        Gaming_Hours: parseFloat(formData.Gaming_Hours),
        Coffee_Cups_Per_Day: parseInt(formData.Coffee_Cups_Per_Day, 10),
        Alcohol_Consumption: formData.Alcohol_Consumption,
        Smoking: formData.Smoking,
        Healthy_Diet: formData.Healthy_Diet,
        Chronic_Stress: formData.Chronic_Stress,
        Family_History_Mental_Illness: formData.Family_History_Mental_Illness,
        Therapy_Attendance: formData.Therapy_Attendance,
        Support_System: formData.Support_System,
        Life_Satisfaction: parseFloat(formData.Life_Satisfaction),
        Productivity_Score: parseFloat(formData.Productivity_Score),
        Absenteeism_Days: parseInt(formData.Absenteeism_Days, 10),
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg =
          typeof data.detail === 'string'
            ? data.detail
            : JSON.stringify(data.detail);
        throw new Error(errorMsg);
      }

      setResult(data);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'API ile bağlantı kurulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setResult(null);
    setStep(0);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  if (result) {
    const accent = RISK_COLORS[result.risk_color] ?? '#1B7F4E';
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.brand}>BurnoutCheck</Text>
          <Text style={styles.resultTitle}>Analiz sonucu</Text>
          <Text style={styles.resultSubtitle}>
            Model skoru ve risk seviyesi aşağıda.
          </Text>

          <View style={[styles.scoreRing, { borderColor: accent }]}>
            <Text style={[styles.scoreValue, { color: accent }]}>
              {result.burnout_score}
            </Text>
            <Text style={styles.scoreMax}>/ 100</Text>
          </View>

          <Text style={[styles.riskLevel, { color: accent }]}>
            {result.risk_level}
          </Text>
          <Text style={styles.riskLabel}>{result.risk_label}</Text>

          <Pressable style={styles.primaryButton} onPress={resetForm}>
            <Text style={styles.primaryButtonText}>Yeni değerlendirme</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={goBack}>
            <Text style={styles.secondaryButtonText}>Forma dön</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>BurnoutCheck</Text>
          <Text style={styles.header}>{currentStep.title}</Text>
          <Text style={styles.subheader}>{currentStep.subtitle}</Text>

          <View style={styles.progressMeta}>
            <Text style={styles.stepText}>
              Adım {step + 1} / {STEPS.length}
            </Text>
            <Text style={styles.filledText}>{filledCount}/33 dolu</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          {currentStep.fields.map((field) => (
            <View key={field.key} style={styles.fieldBlock}>
              <Text style={styles.label}>{field.label}</Text>
              {field.hint ? <Text style={styles.hint}>{field.hint}</Text> : null}

              {field.type === 'select' && field.options ? (
                <OptionChips
                  options={field.options}
                  value={formData[field.key]}
                  onChange={(v) => handleChange(field.key, v)}
                />
              ) : (
                <TextInput
                  style={styles.input}
                  value={formData[field.key]}
                  onChangeText={(v) => handleChange(field.key, v)}
                  keyboardType={field.keyboard ?? 'default'}
                  placeholder={field.hint}
                  placeholderTextColor="#8A97A8"
                />
              )}
            </View>
          ))}

          <View style={styles.navRow}>
            {step > 0 ? (
              <Pressable style={styles.secondaryButtonInline} onPress={goBack}>
                <Text style={styles.secondaryButtonText}>Geri</Text>
              </Pressable>
            ) : (
              <View style={styles.navSpacer} />
            )}

            {isLastStep ? (
              <Pressable
                style={[styles.primaryButtonInline, loading && styles.buttonDisabled]}
                onPress={handlePredict}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Tahmin Et</Text>
                )}
              </Pressable>
            ) : (
              <Pressable style={styles.primaryButtonInline} onPress={goNext}>
                <Text style={styles.primaryButtonText}>Devam Et</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: '#E8F0F4',
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
  },
  brand: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 28,
    color: '#0F3D4C',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#14323F',
    marginBottom: 4,
  },
  subheader: {
    fontSize: 14,
    color: '#5A6B78',
    marginBottom: 18,
    lineHeight: 20,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F3D4C',
  },
  filledText: {
    fontSize: 12,
    color: '#6B7C89',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#C9D8E0',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 22,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1F6F7A',
  },
  fieldBlock: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C3340',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#7A8B98',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7FBFC',
    borderWidth: 1,
    borderColor: '#B8CBD4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#14323F',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F7FBFC',
    borderWidth: 1,
    borderColor: '#B8CBD4',
  },
  chipSelected: {
    backgroundColor: '#1F6F7A',
    borderColor: '#1F6F7A',
  },
  chipText: {
    fontSize: 13,
    color: '#2A4450',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  navSpacer: { flex: 1 },
  primaryButtonInline: {
    flex: 1.4,
    backgroundColor: '#1F6F7A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonInline: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8AA3AE',
  },
  primaryButton: {
    backgroundColor: '#1F6F7A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#8AA3AE',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#1C3340',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resultContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#14323F',
    marginTop: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#5A6B78',
    marginBottom: 28,
    textAlign: 'center',
  },
  scoreRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FBFC',
    marginBottom: 18,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 14,
    color: '#6B7C89',
    marginTop: 2,
  },
  riskLevel: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  riskLabel: {
    fontSize: 15,
    color: '#3D515C',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
});

import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { sendFeedback } from './sendFeedback';
import { enqueueFeedback } from './queue';

interface Props {
  visible: boolean;
  onClose: () => void;
  itineraryId?: string;
}

export default function ShortSurveyModal({ visible, onClose, itineraryId }: Props) {
  const { t, language } = useLanguage();
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    if (submitting) return;
    setQ1('');
    setQ2('');
    onClose();
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const payload = {
      q1: q1.trim(),
      q2: q2.trim(),
      lang: language,
      itineraryId,
      timestampISO: new Date().toISOString(),
    };
    const ok = await sendFeedback(payload);
    if (!ok) await enqueueFeedback(payload);
    setSubmitting(false);
    close();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <Text style={styles.title}>{t('feedback.survey.title') || 'Quick Feedback'}</Text>

          <Text style={styles.label}>{t('feedback.survey.q1') || 'What did you like most about this itinerary?'}</Text>
          <TextInput style={styles.input} value={q1} onChangeText={setQ1} multiline placeholder="" textAlignVertical="top" />

          <Text style={styles.label}>{t('feedback.survey.q2') || 'How can we improve the itinerary experience?'}</Text>
          <TextInput style={styles.input} value={q2} onChangeText={setQ2} multiline placeholder="" textAlignVertical="top" />

          <View style={styles.row}>
            <Pressable onPress={close} disabled={submitting} style={[styles.btn, styles.cancel]}>
              <Text>{t('feedback.common.cancel') || 'Cancel'}</Text>
            </Pressable>
            <Pressable onPress={submit} disabled={submitting} style={[styles.btn, styles.submit]}>
              <Text style={{ color: '#fff' }}>{submitting ? (t('feedback.common.submitting') || 'Submitting...') : (t('feedback.common.submit') || 'Submit')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 12, minHeight: 80, marginBottom: 12, backgroundColor: '#fafafa' },
  row: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: '#f2f2f2' },
  submit: { backgroundColor: '#6B5B95' },
});

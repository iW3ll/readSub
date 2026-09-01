import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signIn } from '../services/authService';
import { syncLocalCardsToCloud } from '../services/supabaseFlashcards';
import { isSupabaseConfigured } from '../services/supabase';

interface LoginScreenProps {
  navigation: any;
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(email, password);
      setLoading(false);

      if (result.error) {
        setErrorMessage(result.error);
        Alert.alert('Erro ao Entrar', result.error);
        return;
      }

      // Sincroniza palavras locais com a nuvem após login bem sucedido
      await syncLocalCardsToCloud();

      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigation.navigate('MainTabs');
      }
    } catch (e: any) {
      setLoading(false);
      setErrorMessage(e.message || 'Erro inesperado ao realizar login.');
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.logoBadge}>
              <Ionicons name="sparkles" size={32} color="#3B82F6" />
            </View>
            <Text style={styles.title}>ReadSub Cloud</Text>
            <Text style={styles.subtitle}>
              Acesse sua conta para sincronizar seus flashcards e acompanhar seu progresso diário.
            </Text>
          </View>

          {/* Aviso se Supabase não foi configurado ainda */}
          {!configured && (
            <View style={styles.warningCard}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>Configuração Necessária</Text>
                <Text style={styles.warningDescription}>
                  Adicione sua URL e Anon Key do Supabase em{' '}
                  <Text style={styles.codeText}>src/services/supabase.ts</Text> para conectar ao seu banco de dados.
                </Text>
              </View>
            </View>
          )}

          {/* Banner de Erro em Destaque */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Formulário */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="seuemail@exemplo.com"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Sua senha secreta"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setErrorMessage(null);
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Entrar na Conta</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer - Link para Cadastro */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem uma conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Criar nova conta</Text>
            </TouchableOpacity>
          </View>

          {/* Modo Convidado */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => {
              if (onLoginSuccess) onLoginSuccess();
              else navigation.navigate('MainTabs');
            }}
          >
            <Text style={styles.guestBtnText}>Continuar no modo local (offline)</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 10,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3F1515',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorBannerText: {
    color: '#FCA5A5',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1B13',
    borderColor: '#78350F',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  warningTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  warningTitle: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  warningDescription: {
    color: '#D97706',
    fontSize: 12,
    lineHeight: 16,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  registerLink: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  guestBtnText: {
    color: '#64748B',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

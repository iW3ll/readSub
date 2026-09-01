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
import { signUp } from '../services/authService';
import { syncLocalCardsToCloud } from '../services/supabaseFlashcards';

interface RegisterScreenProps {
  navigation: any;
  onRegisterSuccess?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  navigation,
  onRegisterSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMessage(null);
    setSuccessInfo(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('A confirmação de senha não confere com a senha.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, name);
      setLoading(false);

      if (result.error) {
        setErrorMessage(result.error);
        Alert.alert('Erro ao Criar Conta', result.error);
        return;
      }

      // Se a sessão foi criada imediatamente (sem confirmação de e-mail obrigatória)
      if (result.session) {
        await syncLocalCardsToCloud();
        Alert.alert('Sucesso! 🎉', 'Conta criada e conectada com sucesso!', [
          {
            text: 'Ir para o App',
            onPress: () => {
              if (onRegisterSuccess) {
                onRegisterSuccess();
              } else {
                navigation.navigate('MainTabs');
              }
            },
          },
        ]);
      } else {
        // Confirmação de e-mail está ativa no Supabase
        setSuccessInfo(
          'Conta criada com sucesso! Se a confirmação de e-mail estiver ativa no Supabase, verifique sua caixa de entrada para ativar a conta antes de fazer login.'
        );
        Alert.alert(
          'Conta Criada! ✉️',
          'Sua conta foi registrada no Supabase. Caso seu projeto exija confirmação de e-mail, verifique sua caixa de entrada ou faça login.',
          [
            {
              text: 'Fazer Login',
              onPress: () => navigation.navigate('Login'),
            },
            {
              text: 'Início',
              onPress: () => navigation.navigate('MainTabs'),
            },
          ]
        );
      }
    } catch (e: any) {
      setLoading(false);
      setErrorMessage(e.message || 'Ocorreu um erro inesperado.');
    }
  };

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
              <Ionicons name="person-add" size={28} color="#10B981" />
            </View>
            <Text style={styles.title}>Criar Nova Conta</Text>
            <Text style={styles.subtitle}>
              Crie seu perfil para salvar seus flashcards e sincronizar em qualquer aparelho.
            </Text>
          </View>

          {/* Mensagem de Erro em Destaque */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Mensagem de Sucesso em Destaque */}
          {successInfo && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.successBannerText}>{successInfo}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Wesley Luiz"
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    setErrorMessage(null);
                  }}
                />
              </View>
            </View>

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
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha (mínimo 6 caracteres)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Crie uma senha"
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repita sua senha"
                  placeholderTextColor="#64748B"
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    setErrorMessage(null);
                  }}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Cadastrar e Começar</Text>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer - Voltar para Login */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Já possui uma conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
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
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  successBannerText: {
    color: '#A7F3D0',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
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
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  loginLink: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
});

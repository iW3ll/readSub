import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, getUserProfile, signOut } from '../services/authService';
import { getUserProgressStats, syncLocalCardsToCloud } from '../services/supabaseFlashcards';
import { isSupabaseConfigured } from '../services/supabase';
import { UserProfile, UserProgressStats } from '../types';
import { getSavedWords } from '../storage/asyncStorage';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [stats, setStats] = useState<UserProgressStats>({
    totalWordsSaved: 0,
    masteredWordsCount: 0,
    learningWordsCount: 0,
    masteryPercentage: 0,
    totalReviews: 0,
    studyStreakDays: 0,
    subtitlesCompleted: 0,
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadUserData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        setUserProfile(
          profile || {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0],
            createdAt: user.created_at,
          }
        );

        const progressStats = await getUserProgressStats();
        setStats(progressStats);
      } else {
        setUserProfile(null);
        // Calcula estatísticas locais caso não esteja logado
        const localWords = await getSavedWords();
        const mastered = localWords.filter((w) => w.mastered).length;
        const total = localWords.length;
        setStats({
          totalWordsSaved: total,
          masteredWordsCount: mastered,
          learningWordsCount: total - mastered,
          masteryPercentage: total > 0 ? Math.round((mastered / total) * 100) : 0,
          totalReviews: localWords.reduce((acc, w) => acc + (w.reviewCount || 0), 0),
          studyStreakDays: 0,
          subtitlesCompleted: 0,
        });
      }
    } catch (e) {
      console.error('Erro ao carregar perfil:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleSync = async () => {
    if (!userProfile) {
      Alert.alert('Faça Login', 'Entre na sua conta para sincronizar seus flashcards na nuvem.');
      return;
    }

    setSyncing(true);
    const count = await syncLocalCardsToCloud();
    await loadUserData();
    setSyncing(false);

    Alert.alert('Sincronização Concluída', `${count} flashcards atualizados na nuvem.`);
  };

  const performSignOut = async () => {
    setLoading(true);
    await signOut();
    setUserProfile(null);
    await loadUserData();
    setLoading(false);
  };

  const handleSignOut = () => {
    setLogoutModalVisible(true);
  };

  const getFluencyLevel = (masteredCount: number) => {
    if (masteredCount >= 200) return { title: 'Avançado (C1/C2)', color: '#8B5CF6' };
    if (masteredCount >= 80) return { title: 'Intermediário (B1/B2)', color: '#3B82F6' };
    if (masteredCount >= 20) return { title: 'Básico (A2)', color: '#10B981' };
    return { title: 'Iniciante (A1)', color: '#F59E0B' };
  };

  const fluency = getFluencyLevel(stats.masteredWordsCount);
  const configured = isSupabaseConfigured();

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Carregando dados de progresso...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Header do Perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {userProfile?.name
                  ? userProfile.name.charAt(0).toUpperCase()
                  : userProfile?.email
                  ? userProfile.email.charAt(0).toUpperCase()
                  : 'G'}
              </Text>
            </View>
            <View style={styles.onlineBadge}>
              <Ionicons
                name={userProfile ? 'cloud-done' : 'cloud-offline'}
                size={12}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {userProfile ? userProfile.name || 'Estudante ReadSub' : 'Modo Convidado'}
            </Text>
            <Text style={styles.userEmail}>
              {userProfile ? userProfile.email : 'Flashcards salvos apenas neste aparelho'}
            </Text>
          </View>

          {!userProfile ? (
            <TouchableOpacity
              style={styles.loginBannerBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
              <Text style={styles.loginBannerText}>Entrar / Cadastrar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Banner de Supabase não configurado */}
        {!configured && (
          <View style={styles.configNotice}>
            <Ionicons name="alert-circle" size={20} color="#F59E0B" />
            <Text style={styles.configNoticeText}>
              Supabase não configurado. Seus flashcards estão funcionando em modo offline local.
            </Text>
          </View>
        )}

        {/* CARD PRINCIPAL: TAXA DE RETENÇÃO & DOMÍNIO */}
        <View style={styles.masteryCard}>
          <View style={styles.masteryHeader}>
            <View>
              <Text style={styles.masteryCardTitle}>Taxa de Domínio</Text>
              <Text style={styles.masteryCardSubtitle}>
                {stats.masteredWordsCount} de {stats.totalWordsSaved} palavras dominadas
              </Text>
            </View>
            <View style={styles.masteryBadge}>
              <Text style={styles.masteryPercentageText}>{stats.masteryPercentage}%</Text>
            </View>
          </View>

          {/* Barra de Progresso */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, stats.masteryPercentage))}%` },
              ]}
            />
          </View>

          {/* Nível de Fluência */}
          <View style={styles.levelRow}>
            <Ionicons name="ribbon-outline" size={18} color={fluency.color} />
            <Text style={styles.levelLabel}>Nível Estimado de Vocabulário:</Text>
            <Text style={[styles.levelValue, { color: fluency.color }]}>{fluency.title}</Text>
          </View>
        </View>

        {/* GRID DE ESTATÍSTICAS DETALHADAS */}
        <Text style={styles.sectionTitle}>Métricas de Aprendizado</Text>
        <View style={styles.statsGrid}>
          {/* Card: Total de Palavras */}
          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="albums" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.statNumber}>{stats.totalWordsSaved}</Text>
            <Text style={styles.statLabel}>Cards Totais</Text>
          </View>

          {/* Card: Palavras Dominadas */}
          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="checkmark-done-circle" size={22} color="#10B981" />
            </View>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>
              {stats.masteredWordsCount}
            </Text>
            <Text style={styles.statLabel}>Dominadas</Text>
          </View>

          {/* Card: Em Aprendizado */}
          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="hourglass" size={22} color="#F59E0B" />
            </View>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
              {stats.learningWordsCount}
            </Text>
            <Text style={styles.statLabel}>Em Estudo</Text>
          </View>

          {/* Card: Total de Revisões */}
          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons name="repeat" size={22} color="#8B5CF6" />
            </View>
            <Text style={[styles.statNumber, { color: '#A78BFA' }]}>{stats.totalReviews}</Text>
            <Text style={styles.statLabel}>Revisões</Text>
          </View>

          {/* Card: Ofensiva de Dias (Streak) */}
          <View style={styles.statBox}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="flame" size={22} color="#EF4444" />
            </View>
            <Text style={[styles.statNumber, { color: '#F87171' }]}>
              {stats.studyStreakDays} {stats.studyStreakDays === 1 ? 'dia' : 'dias'}
            </Text>
            <Text style={styles.statLabel}>Ofensiva</Text>
          </View>

          {/* Card: Sincronização */}
          <TouchableOpacity
            style={styles.statBox}
            onPress={handleSync}
            disabled={syncing || !userProfile}
          >
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              {syncing ? (
                <ActivityIndicator size="small" color="#06B6D4" />
              ) : (
                <Ionicons name="sync" size={22} color="#06B6D4" />
              )}
            </View>
            <Text style={[styles.statNumber, { fontSize: 15, color: '#38BDF8' }]}>
              {syncing ? 'Enviando...' : userProfile ? 'Sincronizar' : 'Offline'}
            </Text>
            <Text style={styles.statLabel}>Nuvem Supabase</Text>
          </TouchableOpacity>
        </View>

        {/* ATALHOS RÁPIDOS */}
        <Text style={styles.sectionTitle}>Ações de Estudo</Text>
        <View style={styles.actionList}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Flashcards')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="play" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Praticar Flashcards Agora</Text>
                <Text style={styles.actionSubtitle}>Revise as palavras que você salvou</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Vocabulário')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="book" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Caderno de Vocabulário</Text>
                <Text style={styles.actionSubtitle}>Ver todas as palavras e frases de contexto</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Ajustes')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#64748B' }]}>
                <Ionicons name="options" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Preferências & Chaves de API</Text>
                <Text style={styles.actionSubtitle}>Configurar DeepL, TTS e velocidade</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>

          {userProfile && (
            <TouchableOpacity
              style={[styles.actionRow, styles.logoutActionRow]}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.actionIcon, { backgroundColor: '#EF4444' }]}>
                  <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.actionTitle, styles.logoutActionTitle]}>
                    Desconectar da Conta
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    Sair da sessão e alternar para modo convidado
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Rodapé Informativo */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>ReadSub Feito por </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://github.com/iW3ll')}>
            <Text style={[styles.footerNoteText, styles.linkText]}>Wesley</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Confirmação de Saída In-App */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBadge}>
              <Ionicons name="log-out-outline" size={32} color="#EF4444" />
            </View>

            <Text style={styles.modalTitle}>Desconectar da Conta?</Text>
            <Text style={styles.modalDescription}>
              Deseja realmente sair da sua conta? Seus flashcards salvos na nuvem permanecerão seguros e você poderá entrar novamente a qualquer momento.
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={async () => {
                  setLogoutModalVisible(false);
                  await performSignOut();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                <Text style={styles.modalConfirmBtnText}>Sim, Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10B981',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 12,
    color: '#94A3B8',
  },
  loginBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  loginBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    padding: 8,
  },
  configNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B13',
    borderColor: '#78350F',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  configNoticeText: {
    color: '#F59E0B',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  masteryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  masteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  masteryCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  masteryCardSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  masteryBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  masteryPercentageText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#60A5FA',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  levelValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  actionList: {
    gap: 10,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  footerNoteText: {
    color: '#475569',
    fontSize: 12,
  },
  linkText: {
    color: '#38BDF8',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  logoutActionRow: {
    borderColor: '#7F1D1D',
    backgroundColor: '#1E1315',
  },
  logoutActionTitle: {
    color: '#F87171',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

# ReadSub 🎬 — Leitor Interativo de Legendas (.SRT) para Aprendizado de Inglês

> **Projeto Final da Disciplina de Laboratório de Desenvolvimento de Aplicações Móveis (Lab 3)**  
> **IFBA — Instituto Federal de Educação, Ciência e Tecnologia da Bahia**  
> **Semestre Letivo: 2026.1**

---

## 👥 Integrantes
- **Estudante 1:** [Wesley Luiz dos Santos Silva] 


---

## 🎯 Problema Identificado e Solução Proposta

### O Problema
Aprender inglês consumindo mídias autênticas (filmes, séries, entrevistas e TED Talks) é uma das formas mais eficientes de fixação de vocabulário e treino de escuta (*listening*). Contudo, a experiência costuma ser interrompida:
1. O aluno precisa pausar o vídeo a todo momento.
2. Precisa alternar para outros aplicativos de dicionário ou navegadores web para pesquisar palavras desconhecidas.
3. Não há um registro automático do contexto em que os termos foram utilizados, dificultando a retenção a longo prazo.

### A Solução — ReadSub
O **ReadSub** é um aplicativo mobile em **React Native / Expo** que transforma qualquer arquivo de legenda `.srt` em uma plataforma interativa de estudos de idiomas. O aplicativo sincroniza a exibição do texto no tempo exato das falas, permitindo que o estudante:
- Toque em qualquer palavra para consultar tradução instantânea em português via **DeepL API** ou dicionário integrado.
- Ouça a pronúncia nativa com síntese de voz (TTS via `expo-speech`).
- Veja definições em inglês, transcrição fonética e exemplos reais de uso.
- Salve os termos desconhecidos com a frase original da legenda em um **Caderno de Vocabulário**.
- Pratique e memorize com **Flashcards interativos** e acompanhamento de progresso.

---

## 🚀 Principais Funcionalidades

- 📁 **Importação de Legendas (.SRT):** Carregamento de arquivos do celular, colagem de texto ou escolha em uma biblioteca pronta de diálogos.
- ⏱️ **Player Sincronizado em Tempo Real:** Motor de reprodução com precisão de milissegundos, controles de Play/Pause, barra de progresso (*Slider*), pular 5s e ajuste de velocidade de 0.5x a 2.0x.
- 🔁 **Modo Loop de Fala:** Repete a fala atual continuamente para treino intensivo de *listening* e *shadowing*.
- 🌐 **Tradução com DeepL API + Fallbacks:** Tradução de alta qualidade para palavras ou frases inteiras, com suporte a chave DeepL do usuário e fallback automático para dicionários públicos offline/online.
- 🗣️ **Síntese de Voz (TTS):** Botão para escutar a pronúncia nativa de palavras isoladas e falas completas.
- 📖 **Caderno de Vocabulário:** Armazenamento local das palavras com a frase de contexto, filtros (Todas, Em Estudo, Dominadas) e busca.
- 🗂️ **Flashcards Interativos de Memorização:** Modo de estudo com cartas rotativas (frente com inglês e frase; verso com português e definição) e estatísticas de retenção.
- 📜 **Transcrição Completa e Pesquisa Rápida:** Listagem de todas as falas da legenda com busca instantânea e clique para saltar o player para o timestamp selecionado.
- ⚙️ **Configurações Personalizadas:** Ajuste de chave DeepL, velocidade da fala, tom de voz e opção de pausar automaticamente ao tocar nas palavras.

---

## 🛠️ Tecnologias Utilizadas

- **Framework Principal:** [React Native](https://reactnative.dev/) com [Expo](https://expo.dev/) (TypeScript)
- **Roteamento e Navegação:** `@react-navigation/native` e `@react-navigation/bottom-tabs`
- **Áudio & Síntese de Voz:** `expo-speech`
- **Seleção e Leitura de Arquivos:** `expo-document-picker` e `expo-file-system`
- **Persistência de Dados Local:** `@react-native-async-storage/async-storage`
- **Componentes Visuais:** `@expo/vector-icons`, `@react-native-community/slider`, `react-native-safe-area-context`
- **Serviços de Tradução e Dados:** [DeepL API](https://www.deepl.com/pro-api), [Free Dictionary API](https://dictionaryapi.dev/) e MyMemory API.

---

## 💾 Estratégia de Armazenamento de Dados

O aplicativo utiliza o `@react-native-async-storage/async-storage` para persistência no dispositivo:
- `@readsub_vocabulary`: Array de objetos contendo palavras salvas, traduções, fonética, classe gramatical, definições, frase de contexto e status de domínio (`mastered: boolean`).
- `@readsub_recent_subtitles`: Histórico das legendas acessadas recentemente e progresso do player.
- `@readsub_settings`: Preferências do usuário (chave DeepL, velocidade do TTS, auto-pausa).
- `@readsub_stats`: Estatísticas agregadas de estudo (palavras salvas, dominadas e legendas concluídas).

---

## 📐 Metodologia de Desenvolvimento

O projeto foi conduzido utilizando metodologia ágil baseada no **Kanban**, com divisão equilibrada de tarefas entre a dupla e iterações semanais orientadas às 5 entregas do plano da disciplina:
- **Entrega 1 (07/ago/2026):** Proposta, escopo, público-alvo, protótipos e planejamento inicial.
- **Entrega 2 (14/ago/2026):** Requisitos funcionais/não funcionais, casos de uso e metodologia.
- **Entrega 3 (21/ago/2026):** Projeto React Native estruturado, rotas, navegação configurada e telas base.
- **Entrega 4 (28/ago/2026):** Parser .SRT funcional, player sincronizado, toque em palavras e persistência local.
- **Entrega 5 (04/set/2026):** Versão final com DeepL API, TTS, Flashcards, Transcrição e documentação completa.

Toda a documentação detalhada das entregas encontra-se na pasta `../docs/`:
- `../docs/01_proposta_e_requisitos.md`
- `../docs/02_planejamento_e_metodologia.md`
- `../docs/03_arquitetura_e_armazenamento.md`

---

## ⚙️ Instruções de Instalação e Execução

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Expo Go](https://expo.dev/go) instalado no smartphone Android ou iOS (ou emulador Android Studio / iOS Simulator).

### Passo a Passo:
1. Abra o terminal na pasta do projeto:
   ```bash
   cd readSub
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento do Expo:
   ```bash
   npx expo start
   ```

4. **Para testar no celular:** Escaneie o QR Code exibido no terminal utilizando o aplicativo **Expo Go** (no Android) ou a Câmera (no iOS).
5. **Para testar no navegador web (opcional):** Pressione a tecla `w` no terminal.

---

## 🔍 Limitações e Melhorias Futuras

- **Sincronização com Áudio/Vídeo Real:** Suporte futuro para carregar arquivos de áudio `.mp3` ou vídeos `.mp4` associados à legenda.
- **Dicionário Offline Completo:** Expansão do banco de dados SQLite local com mais de 50.000 termos com transcrição fonética embutida.
- **Sistema de Repetição Espaçada Avançado (SRS):** Algoritmo SuperMemo (SM-2) para agendamento inteligente das revisões diárias.
- **Exportação Anki:** Exportação de baralhos de vocabulário no formato `.apkg` para integração com o software Anki.

import { SubtitleFile } from '../types';
import { parseSRT } from '../services/srtParser';

const STEVE_JOBS_SRT = `1
00:00:01,000 --> 00:00:04,500
I am honored to be with you today at your commencement.

2
00:00:05,000 --> 00:00:09,800
From one of the finest universities in the entire world.

3
00:00:10,200 --> 00:00:14,600
I never graduated from college. Truth be told, this is the closest I've ever gotten.

4
00:00:15,000 --> 00:00:19,200
Today I want to tell you three stories from my life.

5
00:00:19,800 --> 00:00:23,900
That's it. No big deal. Just three simple stories.

6
00:00:24,500 --> 00:00:28,400
The first story is about connecting the dots.

7
00:00:29,000 --> 00:00:34,200
You can't connect the dots looking forward; you can only connect them looking backwards.

8
00:00:35,000 --> 00:00:40,500
So you have to trust that the dots will somehow connect in your future.

9
00:00:41,200 --> 00:00:46,800
You have to trust in something: your gut, destiny, life, karma, whatever.

10
00:00:47,500 --> 00:00:52,900
Because believing that the dots will connect down the road will give you the courage to follow your heart.

11
00:00:53,500 --> 00:00:58,900
Even when it leads you off the well-worn path. And that will make all the difference.

12
00:00:59,500 --> 00:01:05,000
Your time is limited, so don't waste it living someone else's life.

13
00:01:05,800 --> 00:01:10,500
Stay hungry. Stay foolish. Thank you all very much.`;

const INTERSTELLAR_SRT = `1
00:00:01,000 --> 00:00:05,200
Love is the one thing we're capable of perceiving that transcends dimensions of time and space.

2
00:00:05,800 --> 00:00:10,400
Maybe we should trust that, even if we can't understand it yet.

3
00:00:11,000 --> 00:00:15,800
Cooper, you're a physicist. You're talking about gravitational anomalies and wormholes.

4
00:00:16,500 --> 00:00:21,200
We have to make decisions based on empirical evidence and calculated risks.

5
00:00:22,000 --> 00:00:27,000
I know it sounds crazy, but love isn't something we invented. It's observable, powerful.

6
00:00:27,800 --> 00:00:33,000
It has to mean something. It connects us across billions of light years.

7
00:00:34,000 --> 00:00:39,500
We've always defined ourselves by the ability to overcome the impossible.

8
00:00:40,200 --> 00:00:45,000
And we count these moments, these moments when we dare to aim higher, to break barriers.

9
00:00:45,800 --> 00:00:51,500
To reach for the stars, to make the unknown known.

10
00:00:52,200 --> 00:00:57,000
We count these moments as our proudest achievements.`;

const COFFEE_SHOP_CONVERSATION_SRT = `1
00:00:01,000 --> 00:00:04,800
Hey Mark! Long time no see! How have you been holding up lately?

2
00:00:05,200 --> 00:00:09,500
I've been quite busy with the new software engineering project, to be honest.

3
00:00:10,000 --> 00:00:14,200
Let's grab a table over there and catch up over a cup of hot espresso.

4
00:00:14,800 --> 00:00:19,200
Sounds like a fantastic plan! I could definitely use some caffeine right now.

5
00:00:19,800 --> 00:00:24,000
Are you still working remotely or did they require you to head back to the office?

6
00:00:24,600 --> 00:00:29,200
It's a hybrid schedule. Two days at the headquarters and three days from home.

7
00:00:29,800 --> 00:00:34,500
That strikes a wonderful balance. Gives you flexibility without losing team bonding.

8
00:00:35,000 --> 00:00:39,800
Exactly. By the way, are you still practicing your English vocabulary every single morning?

9
00:00:40,500 --> 00:00:45,000
Yes! I've been using this interactive subtitle application to learn new idioms.

10
00:00:45,600 --> 00:00:50,000
Whenever an unfamiliar word pops up, I simply tap it to reveal the translation!`;

const AI_FUTURE_TALK_SRT = `1
00:00:01,000 --> 00:00:05,200
Artificial intelligence is reshaping every single industry at an unprecedented pace.

2
00:00:05,800 --> 00:00:10,600
From natural language processing to real-time machine translation and automated reasoning.

3
00:00:11,200 --> 00:00:16,000
The question is no longer whether AI will transform society, but how fast we can adapt.

4
00:00:16,800 --> 00:00:21,500
Language learning, in particular, is experiencing a profound technological renaissance.

5
00:00:22,200 --> 00:00:27,000
Learners no longer need to memorize sterile grammar rules out of dusty textbooks.

6
00:00:27,600 --> 00:00:32,800
Instead, contextual immersion with interactive media provides immediate cognitive feedback.

7
00:00:33,500 --> 00:00:38,500
When you engage directly with authentic dialogues, retention rates increase dramatically.

8
00:00:39,200 --> 00:00:44,000
The future of education belongs to interactive, accessible, and personalized tools.`;

export function getSampleSubtitles(): SubtitleFile[] {
  const samples = [
    {
      id: 'sample_steve_jobs',
      title: 'Steve Jobs — Discurso em Stanford (Connecting the Dots)',
      description: 'Discurso inspirador sobre seguir a intuição, destino e resiliência.',
      category: 'speeches' as const,
      rawSrt: STEVE_JOBS_SRT,
    },
    {
      id: 'sample_interstellar',
      title: 'Interestelar — Diálogo sobre Espaço, Tempo e Amor',
      description: 'Cena emblemática de ficção científica com vocabulário de física e emoção.',
      category: 'movies' as const,
      rawSrt: INTERSTELLAR_SRT,
    },
    {
      id: 'sample_coffee_shop',
      title: 'Conversação Cotidiana — Encontro em uma Cafeteria',
      description: 'Diálogo prático do dia a dia com expressões idiomáticas e phrasal verbs.',
      category: 'dialogues' as const,
      rawSrt: COFFEE_SHOP_CONVERSATION_SRT,
    },
    {
      id: 'sample_ai_future',
      title: 'Palestra de Tecnologia — A Revolução da IA e Educação',
      description: 'Apresentação com termos modernos de computação, IA e aprendizado contextual.',
      category: 'speeches' as const,
      rawSrt: AI_FUTURE_TALK_SRT,
    },
  ];

  return samples.map((item) => {
    const cues = parseSRT(item.rawSrt);
    const durationMs = cues.length > 0 ? cues[cues.length - 1].endTimeMs : 0;
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      cues,
      durationMs,
      createdAt: Date.now(),
    };
  });
}

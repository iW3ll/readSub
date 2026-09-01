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

const LITTLE_PRINCE_BOOK = [
  { chapter: 'Chapter 1: The Drawing', text: 'Once when I was six years old I saw a magnificent picture in a book called True Stories from Nature.' },
  { chapter: 'Chapter 1: The Drawing', text: 'It was a picture of a boa constrictor in the act of swallowing an animal.' },
  { chapter: 'Chapter 1: The Drawing', text: 'In the book it said: "Boa constrictors swallow their prey whole, without chewing it."' },
  { chapter: 'Chapter 1: The Drawing', text: 'After that they are not able to move, and they sleep through the six months that they need for digestion.' },
  { chapter: 'Chapter 1: The Drawing', text: 'I pondered deeply, then, over the adventures of the jungle. And after some work with a colored pencil I succeeded in making my first drawing.' },
  { chapter: 'Chapter 1: The Drawing', text: 'My Drawing Number One showed a boa constrictor digesting an elephant.' },
  { chapter: 'Chapter 2: In the Desert', text: 'So I lived my life alone, without anyone that I could really talk to, until I had an accident with my plane in the Desert of Sahara.' },
  { chapter: 'Chapter 2: In the Desert', text: 'Something was broken in my engine. And as I had with me neither a mechanic nor any passengers, I set myself to attempt the difficult repairs alone.' },
  { chapter: 'Chapter 2: In the Desert', text: 'It was a question of life or death for me: I had scarcely enough drinking water to last a week.' },
  { chapter: 'Chapter 2: In the Desert', text: 'The first night, then, I went to sleep on the sand, a thousand miles from any human habitation.' },
  { chapter: 'Chapter 2: In the Desert', text: 'Judge, then, of my surprise when at sunrise I was awakened by an odd little voice. It said: "If you please, draw me a sheep!"' },
  { chapter: 'Chapter 3: The Secret', text: '"And now here is my secret, a very simple secret: It is only with the heart that one can see rightly; what is essential is invisible to the eye."' },
  { chapter: 'Chapter 3: The Secret', text: '"What is essential is invisible to the eye," the little prince repeated, so that he would be sure to remember.' },
  { chapter: 'Chapter 3: The Secret', text: '"It is the time you have wasted for your rose that makes your rose so important."' },
];

const SHERLOCK_HOLMES_BOOK = [
  { chapter: 'Chapter 1: The Woman', text: 'To Sherlock Holmes she is always THE woman. I have seldom heard him mention her under any other name.' },
  { chapter: 'Chapter 1: The Woman', text: 'In his eyes she eclipses and predominates the whole of her sex.' },
  { chapter: 'Chapter 1: The Woman', text: 'It was not that he felt any emotion akin to love for Irene Adler.' },
  { chapter: 'Chapter 1: The Woman', text: 'All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind.' },
  { chapter: 'Chapter 1: The Woman', text: 'He was, I take it, the most perfect reasoning and observing machine that the world has seen.' },
  { chapter: 'Chapter 2: The Mystery', text: 'I had called upon my friend, Mr. Sherlock Holmes, one day in the autumn of last year.' },
  { chapter: 'Chapter 2: The Mystery', text: 'He was in deep conversation with a very stout, florid-faced, elderly gentleman with fiery red hair.' },
  { chapter: 'Chapter 2: The Mystery', text: '"You could not have come at a better time, my dear Watson," Holmes said cordially.' },
  { chapter: 'Chapter 2: The Mystery', text: '"I was afraid that you were engaged."' },
  { chapter: 'Chapter 2: The Mystery', text: '"So I am. Very much so. But I know that you share my love of all that is bizarre and outside the conventions of everyday life."' },
];

export function getSampleSubtitles(): SubtitleFile[] {
  const samples = [
    {
      id: 'sample_book_little_prince',
      title: 'O Pequeno Príncipe (The Little Prince)',
      description: 'Livro digital clássico em inglês sobre imaginação, amizade e valores humanos.',
      category: 'epub' as const,
      contentType: 'epub' as const,
      author: 'Antoine de Saint-Exupéry',
      totalChapters: 3,
      bookItems: LITTLE_PRINCE_BOOK,
    },
    {
      id: 'sample_book_sherlock',
      title: 'Sherlock Holmes — A Scandal in Bohemia',
      description: 'Livro digital de mistério com vocabulário refinado de dedução e investigação.',
      category: 'pdf' as const,
      contentType: 'pdf' as const,
      author: 'Arthur Conan Doyle',
      totalPages: 12,
      bookItems: SHERLOCK_HOLMES_BOOK,
    },
    {
      id: 'sample_steve_jobs',
      title: 'Steve Jobs — Discurso em Stanford (Connecting the Dots)',
      description: 'Discurso inspirador sobre seguir a intuição, destino e resiliência.',
      category: 'speeches' as const,
      contentType: 'subtitle' as const,
      rawSrt: STEVE_JOBS_SRT,
    },
    {
      id: 'sample_interstellar',
      title: 'Interestelar — Diálogo sobre Espaço, Tempo e Amor',
      description: 'Cena emblemática de ficção científica com vocabulário de física e emoção.',
      category: 'movies' as const,
      contentType: 'subtitle' as const,
      rawSrt: INTERSTELLAR_SRT,
    },
    {
      id: 'sample_coffee_shop',
      title: 'Conversação Cotidiana — Encontro em uma Cafeteria',
      description: 'Diálogo prático do dia a dia com expressões idiomáticas e phrasal verbs.',
      category: 'dialogues' as const,
      contentType: 'subtitle' as const,
      rawSrt: COFFEE_SHOP_CONVERSATION_SRT,
    },
    {
      id: 'sample_ai_future',
      title: 'Palestra de Tecnologia — A Revolução da IA e Educação',
      description: 'Apresentação com termos modernos de computação, IA e aprendizado contextual.',
      category: 'speeches' as const,
      contentType: 'subtitle' as const,
      rawSrt: AI_FUTURE_TALK_SRT,
    },
  ];

  return samples.map((item) => {
    if ('bookItems' in item && item.bookItems) {
      const virtualSentenceDurationMs = 4000;
      const cues = item.bookItems.map((bItem, idx) => ({
        id: idx + 1,
        startTimeMs: idx * virtualSentenceDurationMs,
        endTimeMs: (idx + 1) * virtualSentenceDurationMs,
        startTimeStr: item.contentType === 'pdf' ? `Pág. ${Math.floor(idx / 5) + 1}` : bItem.chapter.split(':')[0],
        endTimeStr: `Frase ${idx + 1}`,
        text: bItem.text,
        rawText: bItem.text,
        chapterTitle: bItem.chapter,
        pageNumber: item.contentType === 'pdf' ? Math.floor(idx / 5) + 1 : undefined,
      }));

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        contentType: item.contentType,
        author: item.author,
        totalPages: item.totalPages,
        totalChapters: item.totalChapters,
        cues,
        durationMs: cues[cues.length - 1].endTimeMs,
        createdAt: Date.now(),
      };
    }

    const cues = parseSRT(item.rawSrt || '');
    const durationMs = cues.length > 0 ? cues[cues.length - 1].endTimeMs : 0;
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      contentType: item.contentType,
      cues,
      durationMs,
      createdAt: Date.now(),
    };
  });
}

import type { NavItem } from 'epubjs';

import type { AudiobookSourceAdapter, PreparedAudiobookChapter } from '@/lib/client/audiobooks/pipeline';

export interface ExtractedEpubSection {
  text: string;
  href: string;
}

interface EpubAudiobookAdapterOptions {
  extractBookText: () => Promise<ExtractedEpubSection[]>;
  getTocItems: () => NavItem[];
}

async function buildPreparedEpubChapters({
  extractBookText,
  getTocItems,
}: EpubAudiobookAdapterOptions): Promise<PreparedAudiobookChapter[]> {
  const sections = await extractBookText();
  const chapters = getTocItems();
  const sectionTitleMap = new Map<string, string>();

  for (const chapter of chapters) {
    if (!chapter.href) continue;
    const chapterBaseHref = chapter.href.split('#')[0];
    const chapterTitle = typeof chapter.label === 'string' ? chapter.label.trim() : '';
    if (!chapterTitle) continue;

    for (const section of sections) {
      const sectionBaseHref = section.href.split('#')[0];
      if (section.href === chapter.href || sectionBaseHref === chapterBaseHref) {
        sectionTitleMap.set(section.href, chapterTitle);
      }
    }
  }

  return sections.map((section, index) => ({
    index,
    title: sectionTitleMap.get(section.href) || `Chapter ${index + 1}`,
    text: section.text,
  }));
}

export function createEpubAudiobookSourceAdapter(options: EpubAudiobookAdapterOptions): AudiobookSourceAdapter {
  let preparedChaptersPromise: Promise<PreparedAudiobookChapter[]> | null = null;

  const getPreparedChapters = () => {
    if (!preparedChaptersPromise) {
      preparedChaptersPromise = buildPreparedEpubChapters(options).catch((error) => {
        preparedChaptersPromise = null;
        throw error;
      });
    }
    return preparedChaptersPromise;
  };

  return {
    noContentMessage: 'No text content found in book',
    noAudioGeneratedMessage: 'No audio was generated from the book content',
    prepareChapters: async () => getPreparedChapters(),
    prepareChapter: async (chapterIndex: number) => {
      const chapters = await getPreparedChapters();
      const chapter = chapters[chapterIndex];
      if (!chapter) {
        throw new Error('Invalid chapter index');
      }
      return chapter;
    },
  };
}

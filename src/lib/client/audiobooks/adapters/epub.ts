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
    const chapterTitle = chapter.label.trim();

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
  return {
    noContentMessage: 'No text content found in book',
    noAudioGeneratedMessage: 'No audio was generated from the book content',
    prepareChapters: async () => buildPreparedEpubChapters(options),
    prepareChapter: async (chapterIndex: number) => {
      const chapters = await buildPreparedEpubChapters(options);
      const chapter = chapters[chapterIndex];
      if (!chapter) {
        throw new Error('Invalid chapter index');
      }
      return chapter;
    },
  };
}

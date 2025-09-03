import { getItems, getInfo } from '@bigfive-org/questions';
import { Survey } from './survey';
import { useTranslations } from 'next-intl';
import { saveTest } from '@/actions';
import { unstable_setRequestLocale } from 'next-intl/server';
import { TestLanguageSwitch } from './test-language-switch';

const questionLanguages = getInfo().languages;

interface Props {
  params: { locale: string };
  searchParams: { lang?: string };
}

export default function TestPage({
  params: { locale },
  searchParams: { lang }
}: Props) {
  unstable_setRequestLocale(locale);
  const language =
    lang || (questionLanguages.some((l) => l.id === locale) ? locale : 'en');
  const questions = getItems(language);
  const t = useTranslations('test');

  return (
    <div className="w-full">
      {/* MOD: panel wrapper to match Taroscoper card look */}
      <div className="panel panel--pad">
        <div className="bar" style={{ marginBottom: '1rem' }}>
          <h1 className="title">Big Five Personality Test</h1>
          {/**<TestLanguageSwitch
            availableLanguages={questionLanguages}
            language={language}
  />**/}
        </div>

        <hr className="hr-gold" />

        <Survey
          questions={questions}
          nextText={t('next')}
          prevText={t('back')}
          resultsText={t('seeResults')}
          saveTest={saveTest}
          language={language}
        />
      </div>
    </div>
  );
}
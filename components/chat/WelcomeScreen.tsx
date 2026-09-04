/**
 * 新会话空状态：LIMIS / ELN / 页面助手 三组示例卡片（横线分隔）
 */

import {
  SquarePen, Settings, FileText, Languages, ListChecks, LayoutGrid,
  FlaskConical, FilePenLine, BarChart3, Search,
  ClipboardCheck, CalendarRange, Bell, FileSearch,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

/** 欢迎页示例卡片：纯文本填入，或挂载斜杠 Prompt */
export interface WelcomeExample {
  icon: LucideIcon;
  title: string;
  /** 点击后填入输入框的完整文案 */
  prompt?: string;
  /** 点击后挂载的斜杠 Prompt 名称（如 eln-新建模板） */
  slashPromptName?: string;
}

interface WelcomeScreenProps {
  /** 是否已配置可用模型。未配置时只展示引导去设置的 CTA。 */
  hasModel: boolean;
  /** 点击示例卡片 */
  onPickExample: (example: WelcomeExample) => void;
  /** 点击「前往设置」时回调。 */
  onOpenSettings: () => void;
}

/** 单组示例卡片 */
function ExampleGroup({ examples, onPick }: { examples: WelcomeExample[]; onPick: (ex: WelcomeExample) => void }) {
  return (
    <div className="grid w-full grid-cols-1 gap-2.5 min-[340px]:grid-cols-2">
      {examples.map((example) => {
        const Icon = example.icon;
        return (
          <button
            key={example.title}
            type="button"
            onClick={() => onPick(example)}
            className="group flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="min-w-0 truncate text-[0.8rem] font-medium text-foreground">{example.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export function WelcomeScreen({ hasModel, onPickExample, onOpenSettings }: WelcomeScreenProps) {
  const limisExamples: WelcomeExample[] = [
    { icon: ClipboardCheck, title: t('chat.session.exampleLimsAuditTitle'), slashPromptName: 'lims-报告审核' },
    { icon: CalendarRange, title: t('chat.session.exampleLimsReportPeriodTitle'), slashPromptName: 'lims-周报月报' },
    { icon: Bell, title: t('chat.session.exampleLimsRemindersTitle'), slashPromptName: 'lims-事项提醒' },
    { icon: FileSearch, title: t('chat.session.exampleLimsQueryReportTitle'), slashPromptName: 'lims-查询报告' },
  ];

  const elnExamples: WelcomeExample[] = [
    { icon: FlaskConical, title: t('chat.session.exampleElnCreateTitle'), slashPromptName: 'eln-新建模板' },
    { icon: FilePenLine, title: t('chat.session.exampleElnEditTitle'), slashPromptName: 'eln-编辑模板' },
    { icon: BarChart3, title: t('chat.session.exampleElnStatsTitle'), slashPromptName: 'eln-模板统计' },
    { icon: Search, title: t('chat.session.exampleElnQueryTitle'), slashPromptName: 'eln-查询模板' },
  ];

  const pageExamples: WelcomeExample[] = [
    { icon: FileText, title: t('chat.session.exampleSummarizeTitle'), prompt: t('chat.session.exampleSummarizePrompt') },
    { icon: Languages, title: t('chat.session.exampleTranslateTitle'), prompt: t('chat.session.exampleTranslatePrompt') },
    { icon: ListChecks, title: t('chat.session.exampleExtractTitle'), prompt: t('chat.session.exampleExtractPrompt') },
    { icon: LayoutGrid, title: t('chat.session.exampleTabsTitle'), prompt: t('chat.session.exampleTabsPrompt') },
  ];

  const sections = [limisExamples, elnExamples, pageExamples];

  return (
    <div className="m-auto flex w-full max-w-105 flex-col items-center gap-3 px-2 pt-16 pb-12 text-center">
      <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
        <SquarePen className="size-5 text-primary" />
      </div>

      {!hasModel ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">{t('chat.composer.needModel')}</p>
          <Button variant="outline" size="sm" onClick={onOpenSettings}>
            <Settings className="size-3.5" />
            {t('chat.composer.goToSettings')}
          </Button>
        </div>
      ) : (
        <>
          <p className="text-base font-medium text-foreground">{t('chat.session.welcomeReady')}</p>

          <div className="mt-2 flex w-full flex-col gap-3">
            {sections.map((examples, index) => (
              <div key={index} className="flex w-full flex-col gap-3">
                {index > 0 && <hr className="border-border/80" />}
                <ExampleGroup examples={examples} onPick={onPickExample} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

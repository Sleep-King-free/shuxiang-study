import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/site-footer';
import ExperienceWorkspace from '@/components/workspace/experience-workspace';

export const metadata: Metadata = {
  title: '运营工作台 2.0｜「数」香满屋',
  description: '香山书房AI活动策划、宣传模板、关联阅读任务、反馈复盘与本地活动档案。',
};

export default function ExperiencePage() {
  return (
    <>
      <main id="main" className="experience-main platform-v2">
        <ExperienceWorkspace />

        <div className="wrap page-turn">
          <Link href="/solution">
            <small>上一章</small>
            <b>数字运营方案</b>
          </Link>
          <Link href="/evidence">
            <small>下一章</small>
            <b>证据与成果</b>
          </Link>
        </div>
      </main>

      <SiteFooter
        subtitle="数字文化运营平台 · 2.0"
        right="策划须经人工审核 · 读者体验与模板产出以页面标注为准"
      />
    </>
  );
}

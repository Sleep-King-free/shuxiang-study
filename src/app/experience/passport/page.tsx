import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/site-footer';
import PassportApp from './passport-app';

export const metadata: Metadata = {
  title: '数字文化护照｜「数」香满屋',
  description: '绑定手机号领取数字文化护照：个人身份、阅读时长、书籍记录、徽章、积分与排行榜，一屏查看。',
};

export default function PassportPage() {
  return (
    <>
      <main id="main" className="pp-main">
        <div className="page-hero pp-hero">
          <div className="wrap">
            <div className="crumb">
              <Link href="/">首页</Link> / <Link href="/experience">在线体验</Link> / 数字文化护照
            </div>
            <h1>一本随身携带的阅读护照</h1>
            <p>绑定手机号领取护照编号，之后每次到访、每本书、每枚徽章都记在同一本册页上。</p>
          </div>
        </div>

        <section className="pp-board">
          <div className="wrap">
            <div className="pp-board-head">
              <div className="section-no">交互演示</div>
              <h2>输入手机号，领一本随身护照</h2>
              <p>流程在浏览器本地完成：编号由号码唯一推导，性别与头像即时生效，退出后可随时再登回来。</p>
            </div>

            <PassportApp />
          </div>
        </section>

        <div className="wrap page-turn">
          <Link href="/experience">
            <small>上一章</small>
            <b>AI 运营系统</b>
          </Link>
          <Link href="/evidence">
            <small>下一章</small>
            <b>证据与成果</b>
          </Link>
        </div>
      </main>

      <SiteFooter subtitle="数字文化护照 · 在线体验" right="纯前端演示 · 数据仅存于本机" />
    </>
  );
}

import type { ReactNode } from 'react';

type Props = {
  subtitle: string;
  right: ReactNode;
  title?: string;
};

export default function SiteFooter({ subtitle, right, title = '「数」香满屋' }: Props) {
  return (
    <footer>
      <div className="wrap footer-grid">
        <div>
          <strong>{title}</strong>
          <br />
          {subtitle}
        </div>
        <div>{right}</div>
      </div>
    </footer>
  );
}

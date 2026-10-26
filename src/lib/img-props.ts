/**
 * 响应式图片属性。
 *
 * 站点是静态导出（next/image 的优化器不可用），所以这里手写 srcSet：
 * 浏览器按屏幕宽度和 DPR 自己挑最小的够用版本，手机端不再下载 1MB 原图。
 * src 保留原 JPG 作为不支持 WebP 的极老浏览器兜底。
 */

export type ImgSet = {
  src: string;
  srcSet: string;
  sizes: string;
};

/** 内容区的常规图片宽度：手机上占满容器，桌面上约 640px。 */
const CONTENT_SIZES = '(max-width: 768px) 92vw, 640px';

export const MAP_IMG: ImgSet = {
  src: '/assets/distribution/shiqi-map.jpg',
  srcSet:
    '/assets/distribution/shiqi-map-640.webp 640w, /assets/distribution/shiqi-map-1280.webp 1280w',
  sizes: CONTENT_SIZES,
};

export const BADGE_IMG: ImgSet = {
  src: '/assets/passport/badge-collection.jpg',
  srcSet:
    '/assets/passport/badge-collection-640.webp 640w, /assets/passport/badge-collection-1280.webp 1280w',
  sizes: CONTENT_SIZES,
};

/**
 * IP 形象图：展示在 2~3 列的正方形缩略图里。
 * 420 覆盖手机 2x 屏，600 覆盖手机 3x 屏，840 兜住桌面与放大查看。
 */
export const ipImg = (name: string): ImgSet => ({
  src: `/assets/ip/${name}.jpg`,
  srcSet: `/assets/ip/${name}-420.webp 420w, /assets/ip/${name}-600.webp 600w, /assets/ip/${name}-840.webp 840w`,
  sizes: '(max-width: 768px) 44vw, 200px',
});

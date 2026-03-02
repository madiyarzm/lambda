import React, { useRef, useEffect, useState } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

interface ContainerScrollProps {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}

export const ContainerScroll: React.FC<ContainerScrollProps> = ({
  titleComponent,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scaleDimensions = () => (isMobile ? [0.9, 1] : [1.02, 1]);

  const rotate = useTransform(scrollYProgress, [0, 1], [8, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <div
      ref={containerRef}
      className="h-[60rem] md:h-[80rem] flex items-center justify-center relative px-4 md:px-10"
    >
      <div
        className="py-16 md:py-32 w-full relative"
        style={{ perspective: "1000px" }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

interface HeaderProps {
  translate: MotionValue<number>;
  titleComponent: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ translate, titleComponent }) => {
  return (
    <motion.div
      style={{ translateY: translate }}
      className="max-w-4xl mx-auto text-center space-y-4"
    >
      {titleComponent}
    </motion.div>
  );
};

interface CardProps {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ rotate, scale, children }) => {
  return (
    <motion.div
      style={{ rotateX: rotate, scale }}
      className="max-w-5xl mx-auto mt-10 h-[28rem] md:h-[36rem] w-full
                 border border-slate-800 bg-slate-900 rounded-2xl
                 px-4 py-3 md:px-6 md:py-4"
    >
      <div className="h-full w-full overflow-hidden rounded-xl bg-slate-950/40 border border-slate-800">
        {children}
      </div>
    </motion.div>
  );
};


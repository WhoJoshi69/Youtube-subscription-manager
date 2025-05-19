import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const StyledButton = styled.button`
  --border-radius: 8px;
  --border-width: 2px;
  appearance: none;
  position: relative;
  padding: 0.5rem 1rem;
  border: 0;
  background-color: #212121;
  font-family: "Roboto", Arial, "Segoe UI", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  z-index: 2;
  cursor: pointer;
  height: 36px;

  &::after {
    --m-i: linear-gradient(#000, #000);
    --m-o: content-box, padding-box;
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    padding: var(--border-width);
    border-radius: var(--border-radius);
    background-image: conic-gradient(
      #488cfb,
      #29dbbc,
      #ddf505,
      #ff9f0e,
      #e440bb,
      #655adc,
      #488cfb
    );
    -webkit-mask-image: var(--m-i), var(--m-i);
    mask-image: var(--m-i), var(--m-i);
    -webkit-mask-origin: var(--m-o);
    mask-origin: var(--m-o);
    -webkit-mask-clip: var(--m-o);
    mask-composite: exclude;
    -webkit-mask-composite: destination-out;
    filter: hue-rotate(0);
    animation: rotate-hue linear 500ms infinite;
    animation-play-state: paused;
  }

  &:hover::after {
    animation-play-state: running;
  }

  @keyframes rotate-hue {
    to {
      filter: hue-rotate(1turn);
    }
  }

  &,
  &::after {
    box-sizing: border-box;
    border-radius: var(--border-radius);
  }

  &:active {
    --border-width: 3px;
  }

  /* Add styles for the content wrapper */
  .content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    z-index: 1;
    height: 100%;
  }
`;

interface AnimatedButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ onClick, children, className }) => {
  return (
    <StyledButton onClick={onClick} className={className}>
      <div className="content">
        {children}
      </div>
    </StyledButton>
  );
};

export default AnimatedButton; 
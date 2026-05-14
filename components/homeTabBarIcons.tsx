import Svg, { Path } from 'react-native-svg';

const MUTED = '#9DB2CE';

type IconProps = {
  size: number;
  active: boolean;
  /** Active / “on” colour (path theme primary). */
  color: string;
};

export type TabBarIconProps = IconProps;

/** Home — filled house; muted when inactive. */
export function TabHomeIcon({ size, active, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.04 6.82L14.28 2.79C12.71 1.69 10.3 1.75 8.79 2.92L3.78 6.83C2.78 7.61 1.99 9.21 1.99 10.47V17.37C1.99 19.92 4.06 22 6.61 22H17.39C19.94 22 22.01 19.93 22.01 17.38V10.6C22.01 9.25 21.14 7.59 20.04 6.82ZM12.75 18C12.75 18.41 12.41 18.75 12 18.75C11.59 18.75 11.25 18.41 11.25 18V15C11.25 14.59 11.59 14.25 12 14.25C12.41 14.25 12.75 14.59 12.75 15V18Z"
        fill={active ? color : MUTED}
      />
    </Svg>
  );
}

/** Practice — lightning; filled when active. */
export function TabBoltIcon({ size, active, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.5 9.5H17.1914L11.5 20.8818V14.5H6.80859L12.5 3.11816V9.5Z"
        fill={active ? color : 'none'}
        stroke={active ? undefined : MUTED}
        strokeWidth={active ? 0 : 1.35}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Grow — seedling; filled when active. */
export function TabSeedlingIcon({ size, active, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 18.4996C14.4395 18.4996 16.8927 18.9888 18.7461 19.483C19.6705 19.7295 20.4406 19.9763 20.9785 20.1607C21.1901 20.2333 21.3653 20.2968 21.5 20.3463V21.4996H2.5V20.3463C2.63466 20.2968 2.80991 20.2333 3.02148 20.1607C3.55938 19.9763 4.32951 19.7295 5.25391 19.483C7.10728 18.9888 9.56054 18.4996 12 18.4996ZM11.5 12.3853L11.499 12.3707V12.3648C11.4988 12.3621 11.4984 12.3584 11.498 12.3541C11.4974 12.3454 11.4964 12.3336 11.4951 12.3189C11.4926 12.2893 11.4885 12.2477 11.4824 12.1959C11.4702 12.0922 11.45 11.9464 11.416 11.773C11.3484 11.4281 11.2247 10.9602 11.002 10.4869C10.5527 9.53247 9.66103 8.49958 8 8.49958L7.76465 9.43708C7.76292 9.44019 7.76373 9.44102 7.76367 9.44099L7.7627 9.44001L7.76074 9.43903L7.76172 9.44001C7.76616 9.44264 7.776 9.44834 7.79004 9.45759C7.81818 9.47613 7.86447 9.50857 7.92383 9.5572C8.0424 9.65433 8.21455 9.81678 8.40137 10.064C8.72737 10.4956 9.10721 11.1989 9.32324 12.2896C8.25968 12.42 7.46522 12.1797 6.85645 11.7623C6.14386 11.2736 5.63307 10.5061 5.27246 9.65485C4.91331 8.80693 4.71846 7.91384 4.61426 7.22517C4.57448 6.96225 4.54943 6.73138 4.53223 6.54743C4.66297 6.53712 4.81821 6.52699 4.99219 6.52009C5.56192 6.4975 6.32771 6.50677 7.12305 6.63142C8.74293 6.88536 10.3095 7.5808 10.8223 9.24665L11.7959 9.16462C12.1546 6.4312 14.307 5.24666 16.5576 4.75056C17.6737 4.50453 18.773 4.44056 19.5977 4.43903C19.9522 4.43838 20.2539 4.44993 20.4814 4.46247C20.4671 4.70809 20.4423 5.03963 20.3945 5.42829C20.288 6.29373 20.0758 7.4295 19.6572 8.53571C19.2375 9.64486 18.6228 10.6906 17.7314 11.4166C16.9442 12.0576 15.9135 12.4709 14.5371 12.4322C14.6543 11.6383 15.0339 10.7003 15.4473 9.8736C15.6901 9.38788 15.9334 8.96142 16.1162 8.65681C16.2074 8.5049 16.2834 8.38394 16.3359 8.30134C16.3622 8.26011 16.3828 8.22857 16.3965 8.20759C16.4033 8.1971 16.4088 8.18919 16.4121 8.18415C16.4137 8.18168 16.4143 8.17939 16.415 8.17829L16.416 8.17731L17.2246 6.96442L15.8418 7.42536C14.1336 7.99475 13.3021 9.38863 12.9014 10.564C12.7 11.1548 12.6006 11.7088 12.5508 12.1138C12.5258 12.3169 12.5132 12.4846 12.5068 12.6031C12.5036 12.6624 12.5018 12.7104 12.501 12.7437C12.5006 12.7601 12.5001 12.7733 12.5 12.7828V12.7994L13 12.8004H12.5V16.4996H11.5V12.3853Z"
        fill={active ? color : 'none'}
        stroke={active ? undefined : MUTED}
        strokeWidth={active ? 0 : 1}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Chat — two bubbles; filled when active. */
export function TabChatIcon({ size, active, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13.5 0.75H4.65C2.7 0.75 1.05 2.1 0.75 3.9C0.6 5.4 1.2 6.6 2.25 7.35V11.55C2.25 12.15 3 12.6 3.6 12.15L7.5 8.25H13.35C15 8.25 16.65 7.2 17.1 5.55C17.85 3 15.9 0.75 13.5 0.75ZM10.5 11.25H19.35C21.3 11.25 22.95 12.6 23.25 14.4C23.4 15.9 22.8 17.1 21.75 17.85V22.05C21.75 22.65 21 23.1 20.4 22.65L16.5 18.75H10.65C9 18.75 7.35 17.7 6.9 16.05C6.15 13.5 8.1 11.25 10.5 11.25Z"
        fill={active ? color : 'none'}
        stroke={active ? undefined : MUTED}
        strokeWidth={active ? 0 : 1.1}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Profile — user; filled when active (stroke → solid). */
export function TabUserIcon({ size, active, color }: IconProps) {
  if (active) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
          fill={color}
        />
        <Path
          d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22"
          fill="none"
          stroke={color}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
        stroke={MUTED}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22"
        stroke={MUTED}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

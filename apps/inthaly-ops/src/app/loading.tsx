/**
 * RootLoading
 * Neutralized: We return null here so that the browser does not render a redundant
 * full-screen splash overlay (with name and progress bar) on top of the native Android WebAPK splash.
 * Sub-modules and pages provide their own elegant skeletons without blocking the viewport.
 */
export default function RootLoading() {
  return null
}

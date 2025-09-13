import HeroUpload from '../components/ui/HeroUpload';
import SeoHead from '../components/SeoHead';

export default function Home(){
  return (
    <>
      <SeoHead canonical="https://tailoredcv.app/" />
      <HeroUpload />
    </>
  );
}

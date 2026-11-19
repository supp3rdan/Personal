import { useEffect, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { fedbFrames, findGif } from '../services/media.js';
import { MUSCULOS } from '../lib/labels.js';

function Placeholder({ ex, large }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-line to-card p-2 text-center">
      <Dumbbell className="text-accent" size={large ? 48 : 26} aria-hidden="true" />
      <span className={`font-semibold text-muted ${large ? 'text-sm' : 'text-[10px] leading-tight'}`}>
        {MUSCULOS[ex.musculoPrincipal] || ex.musculoPrincipal}
      </span>
    </div>
  );
}

/**
 * Ordem: frames do free-exercise-db -> GIF da ExerciseDB (só no modal, se ligado) -> placeholder.
 * Os dois frames alternam a cada 1 s para simular a animação.
 */
export default function ExerciseMedia({ ex, large = false, tryGif = false, className = '' }) {
  const frames = fedbFrames(ex.apiRefs?.freeExerciseDb);
  const [loaded, setLoaded] = useState([false, false]);
  const [failed, setFailed] = useState(frames.length === 0);
  const [gif, setGif] = useState(null);
  const [gifFailed, setGifFailed] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setLoaded([false, false]);
    setFailed(frames.length === 0);
    setGif(null);
    setGifFailed(false);
    setFrame(0);
  }, [ex.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // GIF é melhoria: buscado em paralelo e só substitui os frames se carregar
  useEffect(() => {
    if (!tryGif) return undefined;
    let alive = true;
    findGif(ex.apiRefs?.exerciseDbName).then((url) => { if (alive && url) setGif(url); });
    return () => { alive = false; };
  }, [tryGif, ex.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const bothLoaded = loaded[0] && loaded[1];
  useEffect(() => {
    if (!bothLoaded || (gif && !gifFailed)) return undefined;
    const id = setInterval(() => setFrame((f) => 1 - f), 1000);
    return () => clearInterval(id);
  }, [bothLoaded, gif, gifFailed]);

  const showGif = gif && !gifFailed;
  const showFrames = !showGif && !failed;
  const showPlaceholder = !showGif && failed;
  const skeleton = showFrames && !loaded[0];

  return (
    <div className={`relative overflow-hidden ${(showFrames && loaded[0]) || showGif ? 'bg-white' : 'bg-line'} ${className}`}>
      {skeleton && <div className="absolute inset-0 animate-pulse bg-card" aria-hidden="true" />}

      {showFrames && frames.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? `Demonstração: ${ex.nome}` : ''}
          aria-hidden={i === 1 ? 'true' : undefined}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-200"
          style={{ opacity: loaded[i] && (frame === i || !bothLoaded && i === 0) ? 1 : 0 }}
          onLoad={() => setLoaded((l) => (i === 0 ? [true, l[1]] : [l[0], true]))}
          onError={() => { if (i === 0) setFailed(true); }}
        />
      ))}

      {showGif && (
        <img
          src={gif}
          alt={`Demonstração animada: ${ex.nome}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain"
          onError={() => setGifFailed(true)}
        />
      )}

      {showPlaceholder && <Placeholder ex={ex} large={large} />}
    </div>
  );
}

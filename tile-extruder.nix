{
  lib,
  stdenv,
  makeWrapper,
  pnpm,
  nodejs,
  fetchFromGitHub,
}:
stdenv.mkDerivation rec {
  pname = "tile-extruder";
  version = "0.1";
  src = fetchFromGitHub {
    owner = "sporadic-labs";
    repo = pname;
    rev = "cf0de557f4a6ecce3df01bd3f4fe255dc5c239cf";
    hash = "sha256-0XqNkHKXYy0JhlkkDtuwUrtenN+wIYRIZnxulzsY31w=";
  };
  nativeBuildInputs = [
    makeWrapper
    nodejs
    pnpm.configHook
  ];

  installPhase = ''
    runHook preInstall
    pnpm -C packages/tile-extruder build
    cp -r . $out
    mkdir $out/bin
    makeWrapper ${lib.getExe nodejs} $out/bin/tile-extruder \
      --add-flags $out/packages/tile-extruder/bin/cli.js \
      --prefix NODE_PATH : $out/node_modules
    runHook postInstall
  '';

  pnpmDeps = pnpm.fetchDeps {
    inherit pname version src;
    hash = "sha256-Rxq462X+WCgATNRnenokEwo+QrlligpKwaF8YhF33vE=";
  };
}

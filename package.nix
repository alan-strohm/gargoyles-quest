# Inspired by pkgs/applications/editors/uivonim/default.nix
# and pkgs/by-name/in/indiepass-desktop/package.nix
{ lib, buildNpmPackage, fetchFromGitHub, electron }:

buildNpmPackage rec {
  pname = "gargoyles-quest";
  version = "0.1";

  src = ./.;

  npmDepsHash = "sha256-EVzr3gaWB8knfI0PHA8Q7XnIOSgAux598TV9UpWp7/8=";

  # Useful for debugging, just run "nix-shell" and then "electron ."
  nativeBuildInputs = [
    electron
  ];

  # Otherwise it will try to run a build phase (via npm build) that we don't have or need, with an error:
  # Missing script: "build"
  # This method is used in pkgs/by-name/in/indiepass-desktop/package.nix
  dontNpmBuild = true;

  # Needed, otherwise you will get an error:
  # RequestError: getaddrinfo EAI_AGAIN github.com
  env = {
    ELECTRON_SKIP_BINARY_DOWNLOAD = 1;
  };
  
  # The node_modules/XXX is such that XXX is the "name" in package.json
  # The path might differ, for instance in electron-forge you need build/main/main.js
  postInstall = ''
    makeWrapper ${electron}/bin/electron $out/bin/${pname} \
      --add-flags $out/lib/node_modules/${pname}/main.js
    mkdir -p $out/share/applications
    substitute ./assets/gargoyle.desktop \
      $out/share/applications/gargoyle.desktop \
      --replace-fail Exec=gargoyle Exec=$out/bin/${pname}
  '';

}

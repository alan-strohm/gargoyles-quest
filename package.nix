# Inspired by pkgs/applications/editors/uivonim/default.nix
# and pkgs/by-name/in/indiepass-desktop/package.nix
{
  lib,
  buildNpmPackage,
  fetchFromGitHub,
  electron,
}:

buildNpmPackage rec {
  pname = "gargoyles-quest";
  version = "0.1";

  src = ./.;

  #npmDepsHash = "sha256-EVzr3gaWB8knfI0PHA8Q7XnIOSgAux598TV9UpWp7/8=";
  npmDepsHash = "sha256-zvYIvvR5luN5oxQQz6UWmdSsGvBEIFspzKPtoO45cp0=";

  # Useful for debugging, just run "nix-shell" and then "electron ."
  nativeBuildInputs = [
    electron
  ];

  # Needed, otherwise you will get an error:
  # RequestError: getaddrinfo EAI_AGAIN github.com
  env = {
    ELECTRON_SKIP_BINARY_DOWNLOAD = 1;
  };

  # The node_modules/XXX is such that XXX is the "name" in package.json
  # The path might differ, for instance in electron-forge you need build/main/main.js
  postInstall = ''
    cp -r dist $out/lib/node_modules/${pname}
    makeWrapper ${electron}/bin/electron $out/bin/${pname} \
      --add-flags $out/lib/node_modules/${pname}/main.js
    mkdir -p $out/share/applications
    substitute ./misc/gargoyle.desktop \
      $out/share/applications/gargoyle.desktop \
      --replace-fail Exec=gargoyle Exec=$out/bin/${pname}
  '';

}

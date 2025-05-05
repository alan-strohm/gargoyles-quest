{
  inputs.nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.2411.tar.gz";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      packages = rec {
        gargoyles-quest = pkgs.callPackage ./package.nix {};
        default = gargoyles-quest;
      };
    });
}

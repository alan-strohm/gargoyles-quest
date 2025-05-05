{
  inputs.nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.2411.tar.gz";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };
      gargoyles-quest = pkgs.callPackage ./package.nix {};
    in {
      packages = {
        inherit gargoyles-quest;
        default = gargoyles-quest;
      };
      devShells.default = pkgs.mkShell {
        inputsFrom = [ gargoyles-quest ];
        packages = [ pkgs.tiled pkgs.texturepacker ];
      };
    });
}

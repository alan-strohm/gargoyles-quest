{
  inputs.nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.2411.tar.gz";
  inputs.flake-utils.url = "github:numtide/flake-utils";
  inputs.treefmt-nix = {
    url = "github:numtide/treefmt-nix";
    inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      treefmt-nix,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
        treefmtEval = treefmt-nix.lib.evalModule pkgs {
          projectRootFile = "flake.nix";
          programs.nixfmt.enable = true;
          programs.prettier.enable = true;
        };
        gargoyles-quest = pkgs.callPackage ./package.nix { };
      in
      {
        packages = {
          inherit gargoyles-quest;
          default = gargoyles-quest;
        };
        formatter = treefmtEval.config.build.wrapper;
        devShells.default = pkgs.mkShell {
          inputsFrom = [ gargoyles-quest ];
          packages = [
            pkgs.tiled
            pkgs.texturepacker
          ];
        };
      }
    );
}

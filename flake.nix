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
        scale2x =
          with pkgs;
          stdenv.mkDerivation rec {
            pname = "scale2x";
            version = "v4.0";
            src = fetchFromGitHub {
              owner = "amadvance";
              repo = pname;
              rev = "9eeee4fdd788dd77b71ff56910aac9679fa48201";
              hash = "sha256-k03lQbzMJf5OAq531/mvHMHmTL6MT+nOqUZ5ZvQ98nU=";
            };
            nativeBuildInputs = [
              autoreconfHook
              libz
              libpng
            ];
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
          inherit gargoyles-quest scale2x;
          default = gargoyles-quest;
        };
        formatter = treefmtEval.config.build.wrapper;
        devShells.default = pkgs.mkShell {
          inputsFrom = [ gargoyles-quest ];
          packages = [
            scale2x
            pkgs.tiled
            pkgs.texturepacker
          ];
        };
      }
    );
}

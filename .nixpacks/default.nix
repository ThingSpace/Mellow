{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.openssl          # OpenSSL 3.x
    pkgs.pkg-config       # Needed for linking libraries
  ];

  # Make sure Node/Bun can find OpenSSL
  shellHook = ''
    export OPENSSL_DIR=${pkgs.openssl}
    export PKG_CONFIG_PATH=${pkgs.openssl.dev}/lib/pkgconfig
  '';
}

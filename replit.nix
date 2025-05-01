{pkgs}: {
  deps = [
    pkgs.lsof
    pkgs.iana-etc
    pkgs.rustc
    pkgs.openssl
    pkgs.libiconv
    pkgs.cargo
    pkgs.google-cloud-sdk-gce
    pkgs.which
    pkgs.libsndfile
    pkgs.pkg-config
    pkgs.pyenv
    pkgs.glibcLocales
    pkgs.psmisc
    pkgs.portaudio
    pkgs.ffmpeg-full
  ];
}

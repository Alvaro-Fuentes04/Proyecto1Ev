class MusicApp {
  constructor() {
    this.API_BASE_URL = 'http://informatica.iesalbarregas.com:7008';
    this.songs = [];
    this.currentSongIndex = 0;
    this.isPlaying = false;
    this.isLoopActive = false;
    this.isShuffleActive = false;
    this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    this.initializeElements();
    this.setupEventListeners();
    this.fetchSongs();
  }

  initializeElements() {
    this.audioPlayer = document.getElementById('audio-player');
    this.progressBar = document.getElementById('progress-bar');
    this.currentTimeDisplay = document.getElementById('current-time');
    this.totalTimeDisplay = document.getElementById('total-time');
    this.volumeBar = document.getElementById('volume-bar');
    this.volumeIcon = document.getElementById('volume-icon');

    this.currentSongTitle = document.getElementById('current-song-title');

    this.playPauseBtn = document.getElementById('play-pause');
    this.prevSongBtn = document.getElementById('prev-song');
    this.nextSongBtn = document.getElementById('next-song');
    this.loopBtn = document.getElementById('loop-btn');
    this.shuffleBtn = document.getElementById('shuffle-btn');

    this.songList = document.getElementById('song-list');
    this.allSongsFilter = document.getElementById('all-songs-filter');
    this.favoritesFilter = document.getElementById('favorites-filter');

    this.uploadModal = document.getElementById('upload-modal');
    this.openUploadModalBtn = document.getElementById('open-upload-modal');
    this.uploadForm = document.getElementById('upload-form');
    this.closeModalSpan = document.querySelector('.close-modal');

    this.songFileInput = document.getElementById('song-file');
    this.songTitleInput = document.getElementById('song-title');
    this.songArtistInput = document.getElementById('song-artist');
    this.songCoverInput = document.getElementById('song-cover');

  }

  setupEventListeners() {
    this.audioPlayer.addEventListener('timeupdate', () => this.updateProgressBar());
    this.audioPlayer.addEventListener('ended', () => this.handleSongEnd());
    this.progressBar.addEventListener('input', () => this.seekSong());
    this.volumeBar.addEventListener('input', () => this.adjustVolume());

    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.prevSongBtn.addEventListener('click', () => this.changeSong(-1));
    this.nextSongBtn.addEventListener('click', () => this.changeSong(1));
    this.loopBtn.addEventListener('click', () => this.toggleLoop());
    this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());

    this.allSongsFilter.addEventListener('click', () => this.filterSongs('all'));
    this.favoritesFilter.addEventListener('click', () => this.filterSongs('favorites'));

    this.openUploadModalBtn.addEventListener('click', () => this.openUploadModal());
    this.closeModalSpan.addEventListener('click', () => this.closeUploadModal());
    this.uploadModal.addEventListener('click', (e) => {
      if (e.target === this.uploadModal) {
        this.closeUploadModal();
      }
    });

    this.uploadForm.addEventListener('submit', (e) => this.handleSongUpload(e));

    this.songTitleInput.addEventListener('input', () => this.validateTextField(this.songTitleInput, 20));
    this.songArtistInput.addEventListener('input', () => this.validateTextField(this.songArtistInput, 20));

  }

  async fetchSongs() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/songs`);
      if (response.ok) {
        this.songs = await response.json();
        this.renderSongList(this.songs);
      } else {
        const errorText = await response.text();
        alert(`Failed to fetch songs: ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      alert('Failed to fetch songs. Please check the console for details.');
    }
  }

  renderSongList(songsToRender) {
    this.songList.innerHTML = '';
    songsToRender.forEach((song, index) => {
      const songElement = document.createElement('div');
      songElement.classList.add('song-item');
      if (this.isFavorite(song)) {
        songElement.classList.add('favorite');
      }

      songElement.innerHTML = `
            <div>
                <strong>${song.title}</strong> - ${song.artist}
            </div>
            <button class="favorite-btn">${this.isFavorite(song) ? '❤️' : '🤍'}</button>
        `;

      songElement.querySelector('.favorite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFavorite(song);
      });

      songElement.addEventListener('click', () => this.playSong(index));
      this.songList.appendChild(songElement);
    });
  }



  toggleFavorite(song) {
    const index = this.favorites.findIndex(fav => fav.title === song.title);
    if (index > -1) {
      this.favorites.splice(index, 1); // Eliminar de favoritos
    } else {
      this.favorites.push(song); // Añadir a favoritos
    }
    localStorage.setItem('favorites', JSON.stringify(this.favorites));
    this.renderSongList(this.songs); // Volver a renderizar la lista completa
  }

  isFavorite(song) {
    return this.favorites.some(fav => fav.title === song.title);
  }

  filterSongs(type) {

    this.currentFilter = type; // Actualizar el filtro activo

    if (type === 'favorites') {
      this.renderSongList(this.favorites); // Renderizar solo favoritos
    } else {
      this.renderSongList(this.songs); // Renderizar todas las canciones
    }
  }

  playSong(index) {
    this.currentSongIndex = index;
    const song = this.songs[index];

    this.audioPlayer.src = song.url;
    document.getElementById('current-song-cover').src = song.cover;
    document.getElementById('current-song-title').textContent = song.title;
    document.getElementById('current-song-artist').textContent = song.artist;

    this.audioPlayer.play();
    this.isPlaying = true;
    this.updatePlayPauseButtons();
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.audioPlayer.pause();
    } else {
      this.audioPlayer.play();
    }
    this.isPlaying = !this.isPlaying;
    this.updatePlayPauseButtons();
  }

  updatePlayPauseButtons() {
    const playPauseText = this.isPlaying ? '⏸️' : '▶️';
    this.playPauseBtn.textContent = playPauseText;
    this.playPauseHeaderBtn.textContent = playPauseText;
  }

  changeSong(direction) {
    let newIndex = this.currentSongIndex + direction;

    if (this.isShuffleActive) {
      newIndex = Math.floor(Math.random() * this.songs.length);
    } else {
      if (newIndex >= this.songs.length) newIndex = 0;
      if (newIndex < 0) newIndex = this.songs.length - 1;
    }

    this.playSong(newIndex);
  }

  handleSongEnd() {
    if (this.isLoopActive) {
      this.audioPlayer.currentTime = 0;
      this.audioPlayer.play();
    } else {
      this.changeSong(1);
    }
  }

  toggleLoop() {
    this.isLoopActive = !this.isLoopActive;
    this.loopBtn.classList.toggle('active', this.isLoopActive);
  }

  toggleShuffle() {
    this.isShuffleActive = !this.isShuffleActive;
    this.shuffleBtn.classList.toggle('active', this.isShuffleActive);
  }

  adjustVolume() {
    this.audioPlayer.volume = this.volumeBar.value / 100;
    this.updateVolumeIcon();
  }

  updateVolumeIcon() {
    const volume = this.audioPlayer.volume * 100;
    this.volumeIcon.textContent = volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊';
  }

  updateProgressBar() {
    const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
    this.progressBar.value = progress;
    this.currentTimeDisplay.textContent = this.formatDuration(this.audioPlayer.currentTime);
    this.totalTimeDisplay.textContent = this.formatDuration(this.audioPlayer.duration);
  }

  seekSong() {
    this.audioPlayer.currentTime = (this.progressBar.value / 100) * this.audioPlayer.duration;
  }

  formatDuration(duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  validateTextField(input, maxLength) {
    const errorSpan = input.nextElementSibling;
    const value = input.value;
    const validationRegex = /^[a-zA-Z\s]*$/;

    if (!validationRegex.test(value)) {
      errorSpan.textContent = 'Only letters and spaces allowed';
      input.classList.add('invalid');
      return false;
    }

    if (value.length > maxLength) {
      errorSpan.textContent = `Maximum ${maxLength} characters`;
      input.classList.add('invalid');
      return false;
    }

    errorSpan.textContent = '';
    input.classList.remove('invalid');
    return true;
  }

  async handleSongUpload(e) {
    e.preventDefault();

    const titleValid = this.validateTextField(this.songTitleInput, 20);
    const artistValid = this.validateTextField(this.songArtistInput, 20);

    if (!titleValid || !artistValid) {
      alert('Please correct the form errors');
      return;
    }

    if (!this.songFileInput.files.length) {
      document.getElementById('song-file-error').textContent = 'Song file is required';
      return;
    }

    if (!this.songCoverInput.files.length) {
      document.getElementById('song-cover-error').textContent = 'Cover image is required';
      return;
    }

    const formData = new FormData();
    formData.append('song', this.songFileInput.files[0]);
    formData.append('title', this.songTitleInput.value);
    formData.append('artist', this.songArtistInput.value);
    formData.append('cover', this.songCoverInput.files[0]);

    try {
      const response = await fetch(`${this.API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await this.fetchSongs();
        this.uploadForm.reset();
        this.closeUploadModal();
        alert('Song uploaded successfully!');
      } else {
        const errorText = await response.text();
        alert(`Upload failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading song:', error);
      alert('Failed to upload song. Please try again.');
    }
  }

  openUploadModal() {
    this.uploadModal.style.display = 'block';
  }

  closeUploadModal() {
    this.uploadModal.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MusicApp();
});

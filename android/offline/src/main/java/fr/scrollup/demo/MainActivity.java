package fr.scrollup.demo;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.res.AssetManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.io.FileNotFoundException;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Scroll-up, version hors ligne (APK de présentation).
 *
 * Toute l'application est rangée dans l'APK (assets/www) et servie à la
 * WebView sous une adresse HTTPS réservée qui ne sort jamais sur le réseau.
 * Les données (passions, créations, photos) restent sur le téléphone.
 */
public final class MainActivity extends Activity {
    /** Domaine réservé par Android aux contenus locaux : aucune requête réseau. */
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/";
    private static final String ROOT = "www";
    private static final int PICK_IMAGE = 10;

    private static final Map<String, String> TYPES = new HashMap<>();
    static {
        TYPES.put("html", "text/html");
        TYPES.put("js", "text/javascript");
        TYPES.put("mjs", "text/javascript");
        TYPES.put("css", "text/css");
        TYPES.put("json", "application/json");
        TYPES.put("svg", "image/svg+xml");
        TYPES.put("png", "image/png");
        TYPES.put("jpg", "image/jpeg");
        TYPES.put("jpeg", "image/jpeg");
        TYPES.put("webp", "image/webp");
        TYPES.put("gif", "image/gif");
        TYPES.put("ico", "image/x-icon");
        TYPES.put("mp3", "audio/mpeg");
        TYPES.put("ogg", "audio/ogg");
        TYPES.put("m4a", "audio/mp4");
        TYPES.put("wav", "audio/wav");
        TYPES.put("mp4", "video/mp4");
        TYPES.put("webm", "video/webm");
        TYPES.put("woff2", "font/woff2");
        TYPES.put("woff", "font/woff");
        TYPES.put("ttf", "font/ttf");
        TYPES.put("txt", "text/plain");
    }

    private WebView web;
    private FrameLayout root;
    private ValueCallback<Uri[]> fileCallback;
    private View fullScreen;
    private WebChromeClient.CustomViewCallback fullScreenCallback;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(255, 249, 239));
        root.setFitsSystemWindows(true);
        setContentView(root);

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(255, 249, 239));
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setTextZoom(100);
        settings.setUserAgentString(settings.getUserAgentString() + " ScrollUpOffline/1.0");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"https".equals(uri.getScheme()) || !HOST.equals(uri.getHost())) return null;
                return serve(uri, request.getRequestHeaders());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if ("https".equals(scheme) && HOST.equals(uri.getHost())) return false;
                // Une photo ouverte « en taille réelle » reste dans l'application.
                if ("blob".equals(scheme) || "data".equals(scheme)) return false;
                openExternal(uri);
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");
                try {
                    startActivityForResult(Intent.createChooser(intent, "Choisir une photo"), PICK_IMAGE);
                } catch (ActivityNotFoundException e) {
                    fileCallback.onReceiveValue(null);
                    fileCallback = null;
                }
                return true;
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullScreen != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                fullScreen = view;
                fullScreenCallback = callback;
                root.addView(view, new FrameLayout.LayoutParams(-1, -1));
                web.setVisibility(View.GONE);
            }

            @Override
            public void onHideCustomView() {
                closeFullScreen();
            }
        });

        if (state == null || web.restoreState(state) == null) web.loadUrl(HOME);
    }

    /** Sert un fichier de l'application (assets/www), avec les plages d'octets pour la musique. */
    private WebResourceResponse serve(Uri uri, Map<String, String> requestHeaders) {
        String path = uri.getPath();
        if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
        if (path.contains("..")) return notFound();
        AssetManager assets = getAssets();
        String asset = ROOT + path;
        InputStream stream;
        try {
            stream = assets.open(asset, AssetManager.ACCESS_STREAMING);
        } catch (IOException missing) {
            // Application d'une seule page : toute adresse inconnue sans extension ouvre l'accueil.
            if (path.lastIndexOf('.') > path.lastIndexOf('/')) return notFound();
            asset = ROOT + "/index.html";
            path = "/index.html";
            try {
                stream = assets.open(asset, AssetManager.ACCESS_STREAMING);
            } catch (IOException e) {
                return notFound();
            }
        }
        String type = mimeType(path);
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", HOME.substring(0, HOME.length() - 1));
        headers.put("Cache-Control", path.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache");
        headers.put("Accept-Ranges", "bytes");
        String encoding = type.startsWith("text/") || type.endsWith("javascript") || type.endsWith("json") || type.endsWith("svg+xml") ? "utf-8" : null;

        String range = header(requestHeaders, "Range");
        if (range != null && range.startsWith("bytes=")) {
            try {
                long size = assetSize(asset);
                String[] bounds = range.substring(6).split("-", 2);
                long start = bounds[0].isEmpty() ? Math.max(0, size - Long.parseLong(bounds[1])) : Long.parseLong(bounds[0]);
                long end = bounds.length > 1 && !bounds[1].isEmpty() && !bounds[0].isEmpty() ? Math.min(Long.parseLong(bounds[1]), size - 1) : size - 1;
                if (start >= size || start > end) {
                    stream.close();
                    headers.put("Content-Range", "bytes */" + size);
                    return new WebResourceResponse(type, encoding, 416, "Range Not Satisfiable", headers, null);
                }
                skipFully(stream, start);
                headers.put("Content-Range", "bytes " + start + "-" + end + "/" + size);
                headers.put("Content-Length", String.valueOf(end - start + 1));
                return new WebResourceResponse(type, encoding, 206, "Partial Content", headers, new Limited(stream, end - start + 1));
            } catch (IOException | NumberFormatException ignored) {
                // En cas de doute, le fichier entier.
                try {
                    stream.close();
                    stream = assets.open(asset, AssetManager.ACCESS_STREAMING);
                } catch (IOException e) {
                    return notFound();
                }
            }
        }
        return new WebResourceResponse(type, encoding, 200, "OK", headers, stream);
    }

    private long assetSize(String asset) throws IOException {
        try {
            return getAssets().openFd(asset).getLength();
        } catch (FileNotFoundException compressed) {
            InputStream in = getAssets().open(asset, AssetManager.ACCESS_STREAMING);
            long total = 0;
            byte[] buffer = new byte[65536];
            for (int read; (read = in.read(buffer)) > 0; ) total += read;
            in.close();
            return total;
        }
    }

    private static void skipFully(InputStream in, long bytes) throws IOException {
        while (bytes > 0) {
            long skipped = in.skip(bytes);
            if (skipped <= 0) {
                if (in.read() < 0) throw new IOException("Fin de fichier");
                skipped = 1;
            }
            bytes -= skipped;
        }
    }

    /** Ne lit que la plage demandée. */
    private static final class Limited extends FilterInputStream {
        private long left;

        Limited(InputStream in, long length) {
            super(in);
            left = length;
        }

        @Override
        public int read() throws IOException {
            if (left <= 0) return -1;
            int value = super.read();
            if (value >= 0) left--;
            return value;
        }

        @Override
        public int read(byte[] buffer, int offset, int length) throws IOException {
            if (left <= 0) return -1;
            int read = super.read(buffer, offset, (int) Math.min(length, left));
            if (read > 0) left -= read;
            return read;
        }
    }

    private static String header(Map<String, String> headers, String name) {
        if (headers == null) return null;
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(name)) return entry.getValue();
        }
        return null;
    }

    private static String mimeType(String path) {
        int dot = path.lastIndexOf('.');
        String extension = dot < 0 ? "" : path.substring(dot + 1).toLowerCase(Locale.ROOT);
        String type = TYPES.get(extension);
        return type != null ? type : "application/octet-stream";
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<String, String>(), null);
    }

    private void openExternal(Uri uri) {
        String scheme = uri.getScheme();
        if (!"https".equals(scheme) && !"http".equals(scheme) && !"mailto".equals(scheme) && !"tg".equals(scheme)) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "Aucune application pour ouvrir ce lien.", Toast.LENGTH_SHORT).show();
        }
    }

    private void closeFullScreen() {
        if (fullScreen == null) return;
        root.removeView(fullScreen);
        fullScreen = null;
        web.setVisibility(View.VISIBLE);
        if (fullScreenCallback != null) fullScreenCallback.onCustomViewHidden();
        fullScreenCallback = null;
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_IMAGE && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            fileCallback = null;
        }
    }

    /**
     * « Retour » : la fenêtre ouverte se ferme, sinon l'écran précédent
     * (événement `scrollup-android-back`, voir app/src/telegram/buttons.ts).
     * S'il n'y a plus rien à fermer, on propose de quitter.
     */
    @Override
    public void onBackPressed() {
        if (fullScreen != null) {
            closeFullScreen();
            return;
        }
        String url = web.getUrl();
        if (url != null && !url.startsWith(HOME) && web.canGoBack()) {
            web.goBack();
            return;
        }
        web.evaluateJavascript("window.dispatchEvent(new Event('scrollup-android-back',{cancelable:true}))", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String handled) {
                if ("false".equals(handled) || isFinishing()) return;
                new AlertDialog.Builder(MainActivity.this)
                    .setMessage("Quitter Scroll-up ?")
                    .setNegativeButton("Rester", null)
                    .setPositiveButton("Quitter", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            finish();
                        }
                    })
                    .show();
            }
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle state) {
        web.saveState(state);
        super.onSaveInstanceState(state);
    }

    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        if (web != null) {
            root.removeView(web);
            web.destroy();
        }
        super.onDestroy();
    }
}

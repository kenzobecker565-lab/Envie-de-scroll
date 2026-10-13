package fr.scrollup.v1;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.*;
import android.widget.*;

/** V1-only shell. The private installation key stays in WebView DOM storage. */
public final class MainActivity extends Activity {
    private static final String HOST = "envie-de-scroll-production.up.railway.app";
    private static final String START = "https://" + HOST + "/?android=1";
    private static final int PICK_FILE = 10;
    private WebView web;
    private FrameLayout root;
    private LinearLayout error;
    private ProgressBar progress;
    private ValueCallback<Uri[]> fileCallback;
    private View customView;
    private WebChromeClient.CustomViewCallback customCallback;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(255,250,240));
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((v,insets)->{
                android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());
                android.graphics.Insets ime=insets.getInsets(WindowInsets.Type.ime());
                v.setPadding(bars.left,bars.top,bars.right,Math.max(bars.bottom,ime.bottom));
                return insets;
            });
        } else root.setFitsSystemWindows(true);
        web = new WebView(this);
        WebSettings s=web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setUserAgentString(s.getUserAgentString()+" ScrollUpAndroid/1.0");
        CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));
        progress = new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);
        root.addView(progress,new FrameLayout.LayoutParams(-1,6));
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest r){return route(r.getUrl());}
            @Override public boolean shouldOverrideUrlLoading(WebView view,String url){return route(Uri.parse(url));}
            @Override public void onPageFinished(WebView view,String url){progress.setVisibility(View.GONE);}
            @Override public void onReceivedError(WebView view,WebResourceRequest r,WebResourceError e){if(r.isForMainFrame())showError();}
            @Override public void onReceivedHttpError(WebView view,WebResourceRequest r,WebResourceResponse e){if(r.isForMainFrame()&&e.getStatusCode()>=400)showError();}
            @Override public void onReceivedSslError(WebView view,android.webkit.SslErrorHandler handler,android.net.http.SslError e){handler.cancel();showError();}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onProgressChanged(WebView v,int value){progress.setProgress(value);progress.setVisibility(value==100?View.GONE:View.VISIBLE);}
            @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(fileCallback!=null)fileCallback.onReceiveValue(null);
                fileCallback=callback;
                Intent picker=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE);
                try{startActivityForResult(picker,PICK_FILE);}catch(ActivityNotFoundException e){callback.onReceiveValue(null);fileCallback=null;}
                return true;
            }
            @Override public void onShowCustomView(View view,CustomViewCallback callback){
                if(customView!=null){callback.onCustomViewHidden();return;}
                customView=view;customCallback=callback;web.setVisibility(View.GONE);root.addView(view,new FrameLayout.LayoutParams(-1,-1));
            }
            @Override public void onHideCustomView(){hideCustom();}
        });
        setContentView(root);
        // Rotation doesn't recreate the activity; reloads keep the same DOM-storage key.
        web.loadUrl(START);
    }
    private boolean route(Uri uri){
        if("https".equals(uri.getScheme())&&HOST.equals(uri.getHost()))return false;
        String scheme=uri.getScheme();
        if("https".equals(scheme)||"mailto".equals(scheme)||"tel".equals(scheme)){
            try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(ActivityNotFoundException ignored){}
        }
        return true;
    }
    private void showError(){
        progress.setVisibility(View.GONE);
        if(error!=null)return;
        error=new LinearLayout(this);error.setOrientation(LinearLayout.VERTICAL);error.setGravity(android.view.Gravity.CENTER);error.setPadding(40,40,40,40);error.setBackgroundColor(Color.rgb(255,250,240));
        TextView title=new TextView(this);title.setText("Une petite pause de connexion");title.setTextSize(23);title.setTextColor(Color.rgb(50,23,71));title.setGravity(android.view.Gravity.CENTER);error.addView(title);
        TextView text=new TextView(this);text.setText("Scroll-up a besoin d’Internet. Vérifie ta connexion puis réessaie : ta progression reste liée à cette installation.");text.setTextSize(16);text.setPadding(0,24,0,24);text.setGravity(android.view.Gravity.CENTER);error.addView(text);
        Button retry=new Button(this);retry.setText("Réessayer");retry.setOnClickListener(v->{root.removeView(error);error=null;web.loadUrl(START);});error.addView(retry);
        root.addView(error,new FrameLayout.LayoutParams(-1,-1));
    }
    private void hideCustom(){if(customView==null)return;root.removeView(customView);customView=null;web.setVisibility(View.VISIBLE);if(customCallback!=null)customCallback.onCustomViewHidden();customCallback=null;}
    @Override protected void onActivityResult(int req,int result,Intent data){
        super.onActivityResult(req,result,data);
        if(req==PICK_FILE&&fileCallback!=null){
            Uri uri=result==RESULT_OK&&data!=null?data.getData():null;
            // Only the user-selected content URI is granted; no file:// access.
            fileCallback.onReceiveValue(uri!=null&&"content".equals(uri.getScheme())?new Uri[]{uri}:null);fileCallback=null;
        }
    }
    @Override public void onBackPressed(){
        if(customView!=null){hideCustom();return;}
        web.evaluateJavascript("window.dispatchEvent(new Event('scrollup-android-back',{cancelable:true}))",handled->{
            if(!"false".equals(handled))new AlertDialog.Builder(this).setMessage("Quitter Scroll-up ?").setNegativeButton("Rester",null).setPositiveButton("Quitter",(d,w)->finish()).show();
        });
    }
    @Override protected void onPause(){super.onPause();web.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){if(fileCallback!=null)fileCallback.onReceiveValue(null);web.destroy();super.onDestroy();}
}

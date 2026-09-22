import org.mpxj.ProjectFile;
import org.mpxj.mspdi.MSPDIWriter;
import org.mpxj.reader.UniversalProjectReader;

public class Conv {
  public static String toXml(String path) throws Exception {
    ProjectFile pf = new UniversalProjectReader().read(path);
    if (pf == null) throw new Exception("Formato no reconocido: " + path);
    java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();
    new MSPDIWriter().write(pf, b);
    return b.toString("UTF-8");
  }
  public static void main(String[] a) throws Exception {
    String x = toXml(a[0]);
    java.nio.file.Files.write(java.nio.file.Paths.get(a[1]), x.getBytes("UTF-8"));
    System.out.println("OK " + x.length());
  }
}

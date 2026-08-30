-- ============================================================
-- Deckmate — seed data
-- Run AFTER 01_schema.sql.
--
-- 30 users spread across all four roles and all four comp types,
-- so that feed ranking has something to rank. Rule 2 of the build
-- guide: a matching app with an empty database looks broken.
--
-- Every seeded user is a real auth account, password: deckmate123
-- ============================================================

do $seed$
declare
  u record;
begin
  for u in
    select * from (values
      ('00000000-0000-4000-8000-000000000001'::uuid,'aarav.mehta@micamail.in','Aarav Mehta',2026,'A','structurer','early_riser',array['Financial Modeling','Valuation','Excel'],'Winner, 2025 McKinsey Case Challenge','@aarav_mehta'),
      ('00000000-0000-4000-8000-000000000002'::uuid,'sara.chen@micamail.in','Sara Chen',2026,'A','analyst','night_owl',array['Data Analytics','Tableau','Market Analysis'],'Ex-Goldman Sachs IB Analyst','@sarachen'),
      ('00000000-0000-4000-8000-000000000003'::uuid,'rohan.iyer@micamail.in','Rohan Iyer',2025,'D','storyteller','flexible',array['Slide Design','Storytelling','Public Speaking'],'Led Series A prep for a FinTech startup','@rohan_iyer'),
      ('00000000-0000-4000-8000-000000000004'::uuid,'priya.patel@micamail.in','Priya Patel',2026,'C','financial_planner','early_riser',array['Valuation','Pricing','Financial Modeling'],'VP of the Private Equity Club','@priyapatel'),
      ('00000000-0000-4000-8000-000000000005'::uuid,'kabir.singh@micamail.in','Kabir Singh',2026,'B','structurer','night_owl',array['Issue Trees','SWOT','Go-to-Market'],'Runner-up, Bain Case Cup 2025','@kabir_s'),
      ('00000000-0000-4000-8000-000000000006'::uuid,'ananya.rao@micamail.in','Ananya Rao',2025,'A','analyst','flexible',array['Consumer Research','Primary Research','JTBD'],'Published in the MICA Marketing Review','@ananyarao'),
      ('00000000-0000-4000-8000-000000000007'::uuid,'vivek.nair@micamail.in','Vivek Nair',2026,'C','storyteller','night_owl',array['Storytelling','Brand Strategy','Semiotics'],'Copywriter at Ogilvy before MICA','@vivek_nair'),
      ('00000000-0000-4000-8000-000000000008'::uuid,'meera.joshi@micamail.in','Meera Joshi',2026,'B','financial_planner','early_riser',array['Financial Modeling','Unit Economics','Excel'],'CFA Level II candidate','@meerajoshi'),
      ('00000000-0000-4000-8000-000000000009'::uuid,'arjun.desai@micamail.in','Arjun Desai',2025,'D','structurer','flexible',array['Porter Five Forces','Operations','Supply Chain'],'Ops consultant, 3 years at Accenture','@arjun_desai'),
      ('00000000-0000-4000-8000-000000000010'::uuid,'ishita.bose@micamail.in','Ishita Bose',2026,'A','analyst','night_owl',array['Data Analytics','SQL','Market Sizing'],'Built the campus placement dashboard','@ishitabose'),
      ('00000000-0000-4000-8000-000000000011'::uuid,'nikhil.verma@micamail.in','Nikhil Verma',2026,'C','storyteller','early_riser',array['Slide Design','Pitching','Brand Strategy'],'National finalist, Flipkart Wired','@nikhil_v'),
      ('00000000-0000-4000-8000-000000000012'::uuid,'tara.menon@micamail.in','Tara Menon',2025,'B','financial_planner','flexible',array['Valuation','Pricing','Van Westendorp'],'Interned with Deloitte Financial Advisory','@tara_menon'),
      ('00000000-0000-4000-8000-000000000013'::uuid,'aditya.ghosh@micamail.in','Aditya Ghosh',2026,'D','structurer','night_owl',array['Issue Trees','Go-to-Market','Market Entry'],'Won 2 strategy cases this semester','@aditya_g'),
      ('00000000-0000-4000-8000-000000000014'::uuid,'riya.kapoor@micamail.in','Riya Kapoor',2026,'A','analyst','early_riser',array['Consumer Research','Survey Design','Data Analytics'],'Research lead, Consumer Insights Cell','@riyakapoor'),
      ('00000000-0000-4000-8000-000000000015'::uuid,'dev.malhotra@micamail.in','Dev Malhotra',2025,'C','storyteller','flexible',array['Storytelling','Slide Design','Video'],'Made the MICA admissions film','@dev_malhotra'),
      ('00000000-0000-4000-8000-000000000016'::uuid,'sneha.pillai@micamail.in','Sneha Pillai',2026,'B','financial_planner','night_owl',array['Unit Economics','Financial Modeling','Fundraising'],'Analyst at a seed-stage VC','@snehapillai'),
      ('00000000-0000-4000-8000-000000000017'::uuid,'karan.shah@micamail.in','Karan Shah',2026,'D','structurer','early_riser',array['SWOT','Operations','Process Design'],'Six Sigma Green Belt','@karan_shah'),
      ('00000000-0000-4000-8000-000000000018'::uuid,'nandini.rao@micamail.in','Nandini Rao',2025,'A','analyst','flexible',array['Market Analysis','Competitive Intel','Excel'],'Ex-Nielsen, 2 years','@nandini_rao'),
      ('00000000-0000-4000-8000-000000000019'::uuid,'zoya.khan@micamail.in','Zoya Khan',2026,'C','storyteller','night_owl',array['Brand Strategy','Semiotics','Copywriting'],'Brand planning intern at Wieden+Kennedy','@zoyakhan'),
      ('00000000-0000-4000-8000-000000000020'::uuid,'harsh.gupta@micamail.in','Harsh Gupta',2026,'B','financial_planner','early_riser',array['Valuation','Pricing','Excel'],'Runner-up, IIM-A Finance Conclave','@harsh_gupta'),
      ('00000000-0000-4000-8000-000000000021'::uuid,'lakshmi.iyer@micamail.in','Lakshmi Iyer',2025,'D','structurer','flexible',array['Market Entry','Go-to-Market','Issue Trees'],'Strategy intern at Tata Digital','@lakshmi_iyer'),
      ('00000000-0000-4000-8000-000000000022'::uuid,'omar.sheikh@micamail.in','Omar Sheikh',2026,'A','analyst','night_owl',array['Data Analytics','Python','Market Sizing'],'Kaggle competitions expert tier','@omar_sheikh'),
      ('00000000-0000-4000-8000-000000000023'::uuid,'gauri.deshmukh@micamail.in','Gauri Deshmukh',2026,'C','storyteller','early_riser',array['Pitching','Slide Design','Storytelling'],'Best presenter, HUL LIME 2025','@gauri_d'),
      ('00000000-0000-4000-8000-000000000024'::uuid,'imran.qureshi@micamail.in','Imran Qureshi',2025,'B','financial_planner','flexible',array['Financial Modeling','Unit Economics','Valuation'],'Treasury intern at HDFC','@imran_q'),
      ('00000000-0000-4000-8000-000000000025'::uuid,'shreya.nambiar@micamail.in','Shreya Nambiar',2026,'D','structurer','night_owl',array['Operations','Supply Chain','Process Design'],'Plant ops intern at Asian Paints','@shreya_n'),
      ('00000000-0000-4000-8000-000000000026'::uuid,'yash.agarwal@micamail.in','Yash Agarwal',2026,'A','analyst','early_riser',array['Market Analysis','Competitive Intel','Tableau'],'Built a retail pricing tracker','@yash_agarwal'),
      ('00000000-0000-4000-8000-000000000027'::uuid,'anika.reddy@micamail.in','Anika Reddy',2025,'C','storyteller','flexible',array['Brand Strategy','Storytelling','JTBD'],'Brand strategy at Dentsu','@anika_reddy'),
      ('00000000-0000-4000-8000-000000000028'::uuid,'rahul.krishnan@micamail.in','Rahul Krishnan',2026,'B','financial_planner','night_owl',array['Pricing','Van Westendorp','Excel'],'Pricing analyst at Swiggy','@rahul_k'),
      ('00000000-0000-4000-8000-000000000029'::uuid,'divya.saxena@micamail.in','Divya Saxena',2026,'D','structurer','early_riser',array['Sustainability','Operations','SWOT'],'ESG research assistant','@divya_saxena'),
      ('00000000-0000-4000-8000-000000000030'::uuid,'farhan.ali@micamail.in','Farhan Ali',2025,'A','analyst','flexible',array['Primary Research','Consumer Research','Survey Design'],'Field research lead, rural markets study','@farhan_ali')
    ) as t(id,email,name,yr,section,rol,ws,skills,cred,contact)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
      u.email, extensions.crypt('deckmate123', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false,
      '', '', '', ''
    ) on conflict (id) do nothing;

    -- newer Supabase requires an identity row for email sign-in.
    -- If this table's shape differs on your version, seeded users simply
    -- become browse-only; everything else still works.
    begin
      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), u.id,
        json_build_object('sub', u.id::text, 'email', u.email)::jsonb,
        'email', u.id::text, now(), now(), now()
      );
    exception when others then
      raise notice 'identity seed skipped for %: %', u.email, sqlerrm;
    end;

    insert into public.users (
      id, email, name, year, section, role, work_style,
      skills, credibility_line, contact_handle, avatar_url
    ) values (
      u.id, u.email, u.name, u.yr, u.section, u.rol::user_role, u.ws::work_style,
      u.skills, u.cred, u.contact,
      'https://api.dicebear.com/9.x/notionists/svg?seed=' || replace(u.name, ' ', '')
    ) on conflict (id) do nothing;
  end loop;
end $seed$;

-- ---------- requests ----------
-- Six open with future deadlines, two past-deadline so the Phase 8
-- nudge has something to fire on the moment a grader logs in.
insert into public.requests (id, author_id, comp_name, comp_type, skills_needed, roles_needed, team_size, deadline, status) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','McKinsey Case Challenge 2026','strategy_growth',array['Market Analysis','Slide Design'],array['analyst','storyteller']::user_role[],4, now() + interval '12 days','open'),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000007','HUL L.I.M.E. Season 12','marketing_brand',array['Consumer Research','Brand Strategy'],array['analyst','financial_planner']::user_role[],3, now() + interval '6 days','open'),
 ('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000004','Bain Business Bowl','finance',array['Valuation','Financial Modeling'],array['analyst','structurer']::user_role[],3, now() + interval '19 days','open'),
 ('10000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000009','Flipkart Wired 6.0','operations',array['Supply Chain','Data Analytics'],array['analyst','storyteller']::user_role[],4, now() + interval '9 days','open'),
 ('10000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000019','ITC Interrobang','marketing_brand',array['Semiotics','Storytelling'],array['structurer','analyst']::user_role[],2, now() + interval '3 days','open'),
 ('10000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000013','Tata Crucible Campus','strategy_growth',array['Go-to-Market','Market Entry'],array['financial_planner','storyteller']::user_role[],4, now() + interval '25 days','open'),
 ('10000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000002','Deloitte Maverick 2025','finance',array['Financial Modeling','Pricing'],array['financial_planner','storyteller']::user_role[],3, now() - interval '5 days','filled'),
 ('10000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000011','Nestle 4Front 2025','marketing_brand',array['Brand Strategy','Slide Design'],array['analyst','structurer']::user_role[],3, now() - interval '21 days','filled');

-- ---------- applications ----------
-- Live requests carry pending applications so an author has an inbox.
insert into public.applications (request_id, applicant_id, status) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','pending'),
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','pending'),
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000022','accepted'),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000006','pending'),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000014','accepted'),
 ('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000008','pending'),
 ('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000024','accepted'),
 ('10000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000010','pending'),
 ('10000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000025','declined'),
 ('10000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000027','pending'),
 ('10000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000020','pending'),
 -- past-deadline teams: these are what the nudge asks about
 ('10000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000016','accepted'),
 ('10000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000003','accepted'),
 ('10000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000018','accepted'),
 ('10000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000005','accepted');

-- ---------- ratings ----------
-- Only the older competition has been rated, so some profiles carry a
-- reliability score and most do not. An unrated profile is the honest
-- default, and the empty state has to look designed.
insert into public.ratings (request_id, rater_id, rated_id, would_team_again) values
 ('10000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000018',true),
 ('10000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000005',true),
 ('10000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000018','00000000-0000-4000-8000-000000000011',true),
 ('10000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000018','00000000-0000-4000-8000-000000000005',false),
 ('10000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000011',true),
 ('10000000-0000-4000-8000-000000000008','00000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000018',true);

-- ---------- what you should see ----------
select
  (select count(*) from public.users)        as users,
  (select count(*) from public.requests)     as requests,
  (select count(*) from public.applications) as applications,
  (select count(*) from public.ratings)      as ratings;
-- expected: 30 | 8 | 15 | 6
